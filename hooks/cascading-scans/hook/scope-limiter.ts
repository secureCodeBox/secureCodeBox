import {
  Finding,
  ScopeLimiter,
  ScopeLimiterAliases,
} from "./scan-helpers";
import {
  V1ObjectMeta
} from "@kubernetes/client-node/dist/gen/model/v1ObjectMeta";
import * as Mustache from "mustache";
import { Address4 } from "ip-address";
import {
  fromUrl,
  parseDomain,
  ParseResultType
} from "parse-domain";
import {
  isEqual,
  takeRight
} from "lodash";

export enum ScopeLimiterRequirementOperator {
  In = "In",
  NotIn = "NotIn",
  Exists = "Exists",
  DoesNotExist = "DoesNotExist",
  Contains = "Contains",
  DoesNotContain = "DoesNotContain",
  InCIDR = "InCIDR",
  NotInCIDR = "NotInCIDR",
  SubdomainOf = "SubdomainOf",
  NotSubdomainOf = "NotSubdomainOf",
}

export interface ScopeLimiterRequirement {
  key: string;
  operator: ScopeLimiterRequirementOperator;
  values: Array<string>;
}

export const scopeDomain = "scope.cascading.securecodebox.io/"

export function isInScope(
  scopeLimiter: ScopeLimiter,
  scanAnnotations: V1ObjectMeta['annotations'],
  finding: Finding,
  scopeLimiterAliases: ScopeLimiterAliases,
) {
  if (scopeLimiter === undefined) return true;

  function validateRequirement({key, operator, values}: ScopeLimiterRequirement) {
    if (!key.startsWith(`${scopeDomain}`)) {
      throw new Error(`key '${key}' is invalid: key does not start with '${scopeDomain}'`);
    }

    const { operator: operatorFunction, validator: validatorFunction } = operatorFunctions[operator];
    if (operatorFunction === undefined) {
      throw new Error(`Unknown operator '${operator}'`);
    }
    const value = scanAnnotations[key];
    const renders = values.map(templateValue);
    if (renders.some(render => !render[1])) {
      return scopeLimiter.validOnMissingRender;
    }

    const props: Operands = {
      scopeAnnotationValue: value,
      findingValues: renders.map(render => render[0])
    };

    try {
      validatorFunction(props);
    } catch (error) {
      throw new Error(`using operator '${operator}': ${error.message}`);
    }

    return operatorFunction(props);
  }

  function templateValue(value: string): [string, boolean] {
    if (value === undefined) return [undefined, true];
    let mapped = Mustache.render(value, {
      $: {
        ...scopeLimiterAliases
      }
    });
    if (mapped == "") {
      mapped = value;
    }
    let rendered = Mustache.render(mapped, finding);
    return [rendered, rendered != ""];
  }

  return [
    scopeLimiter.allOf !== undefined ? scopeLimiter.allOf.every(validateRequirement) : true,
    scopeLimiter.anyOf !== undefined ? scopeLimiter.anyOf.some(validateRequirement) : true,
    scopeLimiter.noneOf !== undefined ? !scopeLimiter.noneOf.some(validateRequirement) : true,
  ].every(entry => entry === true);
}

interface Operands {
  scopeAnnotationValue: string,
  findingValues: string[],
}

interface OperatorFunctions {
  operator: (operands: Operands) => boolean,
  validator: (operands: Operands) => void,
}

const defaultValidator: OperatorFunctions["validator"] = props => validate(props, false, false);

const operatorFunctions: { [key in ScopeLimiterRequirementOperator]: OperatorFunctions } = {
  [ScopeLimiterRequirementOperator.In]: {
    operator: operatorIn,
    validator: defaultValidator,
  },
  [ScopeLimiterRequirementOperator.NotIn]: {
    operator: props => !operatorIn(props),
    validator: defaultValidator,
  },
  [ScopeLimiterRequirementOperator.Exists]: {
    operator: operatorExists,
    validator: props => validate(props, true, true),
  },
  [ScopeLimiterRequirementOperator.DoesNotExist]: {
    operator: props => !operatorExists(props),
    validator: props => validate(props, true, true),
  },
  [ScopeLimiterRequirementOperator.Contains]: {
    operator: operatorContains,
    validator: defaultValidator,
  },
  [ScopeLimiterRequirementOperator.DoesNotContain]: {
    operator: props => !operatorContains(props),
    validator: defaultValidator,
  },
  [ScopeLimiterRequirementOperator.InCIDR]: {
    operator: operatorInCIDR,
    validator: defaultValidator,
  },
  [ScopeLimiterRequirementOperator.NotInCIDR]: {
    operator: props => !operatorInCIDR(props),
    validator: defaultValidator,
  },
  [ScopeLimiterRequirementOperator.SubdomainOf]: {
    operator: operatorSubdomainOf,
    validator: defaultValidator,
  },
  [ScopeLimiterRequirementOperator.NotSubdomainOf]: {
    operator: props => !operatorSubdomainOf(props),
    validator: defaultValidator,
  },
}

function validate({scopeAnnotationValue, findingValues}: Operands, scopeAnnotationValueUndefinedAllowed, findingValuesUndefinedAllowed) {
  if (!scopeAnnotationValueUndefinedAllowed && scopeAnnotationValue === undefined) {
    throw new Error(`the referenced annotation may not be undefined`)
  }
  if (!findingValuesUndefinedAllowed && findingValues === undefined) {
    throw new Error(`the values field may not be undefined`)
  }
}

function operatorIn({scopeAnnotationValue, findingValues}: Operands): boolean {
  return findingValues.includes(scopeAnnotationValue);
}
function operatorExists({scopeAnnotationValue, findingValues}: Operands): boolean {
  return scopeAnnotationValue !== undefined;
}

function operatorContains({scopeAnnotationValue, findingValues}: Operands): boolean {
  const scopeAnnotationValues = scopeAnnotationValue.split(",");
  return findingValues.every(findingValue => scopeAnnotationValues.includes(findingValue));
}

function operatorInCIDR({scopeAnnotationValue, findingValues}: Operands): boolean {
  const scopeAnnotationSubnet = new Address4(scopeAnnotationValue);
  return findingValues.every(findingValue => new Address4(findingValue).isInSubnet(scopeAnnotationSubnet));
}

function operatorSubdomainOf({scopeAnnotationValue, findingValues}: Operands): boolean {
  const scopeAnnotationDomain = parseDomain(fromUrl(scopeAnnotationValue));
  if (scopeAnnotationDomain.type == ParseResultType.Listed) {
    return findingValues.every(findingValue => {
        const findingDomain = parseDomain(fromUrl(findingValue));
        if (findingDomain.type == ParseResultType.Listed) {
          // Equal length domains can pass as subdomain of
          if (scopeAnnotationDomain.labels.length > findingDomain.labels.length) {
            return false;
          }

          // Check if last part of domain is equal
          return isEqual(
            scopeAnnotationDomain.labels,
            takeRight(findingDomain.labels, scopeAnnotationDomain.labels.length)
          );
        }
        console.log(`${findingValue} is an invalid domain name`)
        return false;
    })
  } else {
    throw new Error(`${scopeAnnotationValue} is an invalid domain name`);
  }
}
