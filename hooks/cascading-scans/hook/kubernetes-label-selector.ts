// SPDX-FileCopyrightText: 2021 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

export enum LabelSelectorRequirementOperator {
  In = "In",
  NotIn = "NotIn",
  Exists = "Exists",
  DoesNotExist = "DoesNotExist"
}

// See: https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.18/#labelselectorrequirement-v1-meta
// Re created in TS because the included types suck 😕
export interface LabelSelectorRequirement {
  key: string;
  values: Array<string>;

  operator: LabelSelectorRequirementOperator;
}

export interface LabelSelector {
  matchExpressions?: Array<LabelSelectorRequirement>;
  matchLabels?: Map<string, string>;
}

// generateSelectorString transforms a kubernetes labelSelector object in to the string representation
export function generateSelectorString({
  matchExpressions = [],
  matchLabels = new Map()
}: LabelSelector): string {
  const matchLabelsSelector = Array.from(Object.entries(matchLabels)).map(generateLabelsSelectorString);

  const matchExpressionsSelector = matchExpressions.map(generateExpressionsSelectorString);

  return [...matchLabelsSelector, ...matchExpressionsSelector].join(",");
}

function generateLabelsSelectorString([key, values]) {
  return `${key}=${values}`
}

function generateExpressionsSelectorString({key, values, operator}: LabelSelectorRequirement) {
  switch (operator) {
    case LabelSelectorRequirementOperator.In:
    case LabelSelectorRequirementOperator.NotIn:
      return `${key} ${operator.toLowerCase()} (${values.join(",")})`;

    case LabelSelectorRequirementOperator.Exists:
      return key;

    case LabelSelectorRequirementOperator.DoesNotExist:
      return `!${key}`;

    default:
      const supportedOperators = Object.values(
        LabelSelectorRequirementOperator
      ).join(", ");

      throw new Error(
        `Unknown LabelSelector Operator "${operator}". Supported are (${supportedOperators}). If this is an official label selector operator in kubernetes please open up a issue in the secureCodeBox Repo.`
      );
  }
}
