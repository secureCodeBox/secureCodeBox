// SPDX-FileCopyrightText: 2020 iteratec GmbH
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
  matchExpression: Array<LabelSelectorRequirement>;
  matchLabels: Map<string, string>;
}

// generateLabelSelectorString transforms a kubernetes labelSelector object in to the string representation
export function generateLabelSelectorString({
  matchExpression = [],
  matchLabels = new Map()
}: LabelSelector): string {
  const matchLabelsSelector = Array.from(Object.entries(matchLabels)).map(
    ([key, values]) => `${key}=${values}`
  );

  const matchExpressionsSelector = matchExpression.map(
    ({ key, values, operator }) => {
      if (
        operator === LabelSelectorRequirementOperator.In ||
        operator === LabelSelectorRequirementOperator.NotIn
      ) {
        return `${key} ${operator.toLowerCase()} (${values.join(",")})`;
      }

      if (operator === LabelSelectorRequirementOperator.Exists) {
        return key;
      }
      if (operator === LabelSelectorRequirementOperator.DoesNotExist) {
        return `!${key}`;
      }

      const supportedOperators = Object.values(
        LabelSelectorRequirementOperator
      ).join(", ");

      throw new Error(
        `Unknown LabelSelector Operator "${operator}". Supported are (${supportedOperators}). If this is an official label selector operator in kubernetes please open up a issue in the secureCodeBox Repo.`
      );
    }
  );

  return [...matchLabelsSelector, ...matchExpressionsSelector].join(",");
}
