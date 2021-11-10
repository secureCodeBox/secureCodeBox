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

export enum ScanAnnotationSelectorRequirementOperator {
  In = "In",
  NotIn = "NotIn",
  Exists = "Exists",
  DoesNotExist = "DoesNotExist",
  Contains = "Contains",
  DoesNotContain = "DoesNotContain",
  InCIDR = "InCIDR",
  NotInCIDR = "NotInCIDR",
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

  if (scanAnnotationSelector.allOf !== undefined) return scanAnnotationSelector.allOf.every(validateRequirement);

  if (scanAnnotationSelector.anyOf !== undefined) return scanAnnotationSelector.anyOf.some(validateRequirement);

  if (scanAnnotationSelector.noneOf !== undefined) return !scanAnnotationSelector.noneOf.some(validateRequirement);

  return true;
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
