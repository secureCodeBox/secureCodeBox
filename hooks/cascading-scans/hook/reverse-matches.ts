import {
  Finding,
  ScanAnnotationSelector,
  SelectorAttributeMappings,
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

export enum ScanAnnotationSelectorRequirementOperator {
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

export interface ScanAnnotationSelectorRequirement {
  key: string;
  operator: ScanAnnotationSelectorRequirementOperator;
  values: Array<string>;
}

export function isReverseMatch(
  scanAnnotationSelector: ScanAnnotationSelector,
  scanAnnotations: V1ObjectMeta['annotations'],
  finding: Finding,
  selectorAttributeMappings: SelectorAttributeMappings,
) {
  if (scanAnnotationSelector === undefined) return true;

  function validateRequirement({key, operator, values}: ScanAnnotationSelectorRequirement) {
    const { operator: operatorFunction, validator: validatorFunction } = operatorFunctions[operator];
    if (operatorFunction === undefined) {
      throw new Error(`Unknown operator '${operatorFunction}'`);
    }
    const value = scanAnnotations[key];
    const renders = values.map(templateValue);
    if (renders.some(render => !render[1])) {
      return scanAnnotationSelector.validOnMissingRender;
    }

    const props = {lhs: value, rhs: renders.map(render => render[0])};

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
        ...selectorAttributeMappings
      }
    });
    if (mapped == "") {
      mapped = value;
    }
    let rendered = Mustache.render(mapped, finding);
    return [rendered, rendered != ""];
  }

  return [
    scanAnnotationSelector.allOf !== undefined ? scanAnnotationSelector.allOf.every(validateRequirement) : true,
    scanAnnotationSelector.anyOf !== undefined ? scanAnnotationSelector.anyOf.some(validateRequirement) : true,
    scanAnnotationSelector.noneOf !== undefined ? !scanAnnotationSelector.noneOf.some(validateRequirement) : true,
  ].every(entry => entry === true);
}

interface Operands {
  lhs: string,
  rhs: string[],
}

interface OperatorFunctions {
  operator: (operands: Operands) => boolean,
  validator: (operands: Operands) => void,
}

const defaultValidator: OperatorFunctions["validator"] = props => validate(props, false, false);

const operatorFunctions: { [key in ScanAnnotationSelectorRequirementOperator]: OperatorFunctions } = {
  [ScanAnnotationSelectorRequirementOperator.In]: {
    operator: operatorIn,
    validator: defaultValidator,
  },
  [ScanAnnotationSelectorRequirementOperator.NotIn]: {
    operator: props => !operatorIn(props),
    validator: defaultValidator,
  },
  [ScanAnnotationSelectorRequirementOperator.Exists]: {
    operator: operatorExists,
    validator: props => validate(props, true, true),
  },
  [ScanAnnotationSelectorRequirementOperator.DoesNotExist]: {
    operator: props => !operatorExists(props),
    validator: props => validate(props, true, true),
  },
  [ScanAnnotationSelectorRequirementOperator.Contains]: {
    operator: operatorContains,
    validator: defaultValidator,
  },
  [ScanAnnotationSelectorRequirementOperator.DoesNotContain]: {
    operator: props => !operatorContains(props),
    validator: defaultValidator,
  },
  [ScanAnnotationSelectorRequirementOperator.InCIDR]: {
    operator: operatorInCIDR,
    validator: defaultValidator,
  },
  [ScanAnnotationSelectorRequirementOperator.NotInCIDR]: {
    operator: props => !operatorInCIDR(props),
    validator: defaultValidator,
  },
  [ScanAnnotationSelectorRequirementOperator.SubdomainOf]: {
    operator: operatorSubdomainOf,
    validator: defaultValidator,
  },
  [ScanAnnotationSelectorRequirementOperator.NotSubdomainOf]: {
    operator: props => !operatorSubdomainOf(props),
    validator: defaultValidator,
  },
}

function validate({lhs, rhs}: Operands, lhsUndefinedAllowed, rhsUndefinedAllowed) {
  if (!lhsUndefinedAllowed && lhs === undefined) {
    throw new Error(`annotation may not be undefined`)
  }
  if (!rhsUndefinedAllowed && rhs === undefined) {
    throw new Error(`values may not be undefined`)
  }
}

function operatorIn({lhs, rhs}: Operands): boolean {
  return rhs.includes(lhs);
}
function operatorExists({lhs, rhs}: Operands): boolean {
  return lhs !== undefined;
}

function operatorContains({lhs, rhs}: Operands): boolean {
  const valueArray = lhs.split(",");
  return rhs.every(value => valueArray.includes(value));
}

function operatorInCIDR({lhs, rhs}: Operands): boolean {
  const subnet = new Address4(lhs);
  return rhs.every(value => new Address4(value).isInSubnet(subnet));
}

function operatorSubdomainOf({lhs, rhs}: Operands): boolean {
  const lhsResult = parseDomain(fromUrl(lhs));
  if (lhsResult.type == ParseResultType.Listed) {
    return rhs.every(value => {
        const rhsResult = parseDomain(fromUrl(value));
        if (rhsResult.type == ParseResultType.Listed) {
          // Equal length domains can pass as subdomain of
          if (lhsResult.labels.length > rhsResult.labels.length) {
            return false;
          }

          // Check if last part of domain is equal
          return isEqual(
            lhsResult.labels,
            takeRight(rhsResult.labels, lhsResult.labels.length)
          );
        }
        console.log(`${rhs} is an invalid domain name`)
        return false;
    })
  } else {
    throw new Error(`${lhs} is an invalid domain name`);
  }
}
