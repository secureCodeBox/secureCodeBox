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
    const operatorFunction = operators[operator];
    if (operatorFunction === undefined) {
      throw new Error(`Unknown operator '${operator}'`);
    }
    const value = scanAnnotations[key];
    const renders = values.map(templateValue);
    if (renders.some(render => !render[1])) {
      return scanAnnotationSelector.validOnMissingRender;
    }
    return operatorFunction({lhs: value, rhs: renders.map(render => render[0])});
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

interface operands {
  lhs: string,
  rhs: string[],
}

const operators: { [key in ScanAnnotationSelectorRequirementOperator]:(props: operands) => boolean; } = {
  [ScanAnnotationSelectorRequirementOperator.In]: operatorIn,
  [ScanAnnotationSelectorRequirementOperator.NotIn]: props => !operatorIn(props),
  [ScanAnnotationSelectorRequirementOperator.Exists]: operatorExists,
  [ScanAnnotationSelectorRequirementOperator.DoesNotExist]: props => !operatorExists(props),
  [ScanAnnotationSelectorRequirementOperator.Contains]: operatorContains,
  [ScanAnnotationSelectorRequirementOperator.DoesNotContain]: props => !operatorContains(props),
  [ScanAnnotationSelectorRequirementOperator.InCIDR]: operatorInCIDR,
  [ScanAnnotationSelectorRequirementOperator.NotInCIDR]: props => !operatorInCIDR(props),
  [ScanAnnotationSelectorRequirementOperator.SubdomainOf]: operatorSubdomainOf,
  [ScanAnnotationSelectorRequirementOperator.NotSubdomainOf]: props => !operatorSubdomainOf(props),
}

function operatorIn({lhs, rhs}: operands): boolean {
  if (rhs === undefined) {
    throw new Error("Values may not be undefined when using the operator 'In'")
  }
  return rhs.includes(lhs);
}
function operatorExists({lhs, rhs}: operands): boolean {
  if (rhs !== undefined) {
    throw new Error("Values must be undefined when using the operator 'Exists'")
  }
  return lhs !== undefined;
}

function operatorContains({lhs, rhs}: operands): boolean {
  if (rhs === undefined) {
    throw new Error("Values may not be undefined when using the operator 'Contains'")
  }

  const valueArray = lhs.split(",");

  return rhs.every(value => valueArray.includes(value));
}

function operatorInCIDR({lhs, rhs}: operands): boolean {
  if (rhs === undefined) {
    throw new Error("Values may not be undefined when using the operator 'InCIDR'")
  }
  const subnet = new Address4(lhs);
  return rhs.every(value => new Address4(value).isInSubnet(subnet));
}

function operatorSubdomainOf({lhs, rhs}: operands): boolean {
  if (rhs === undefined) {
    throw new Error("Values may not be undefined when using the operator 'SubdomainOf'")
  }
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
