import {
  Finding,
  ScopeLimiter,
  ScopeLimiterAliases,
} from "./scan-helpers";
import {
  V1ObjectMeta
} from "@kubernetes/client-node/dist/gen/model/v1ObjectMeta";
import * as Mustache from "mustache";
import { Address4, Address6 } from "ip-address";
import {
  fromUrl,
  parseDomain,
  ParseResultType
} from "parse-domain";
import {
  flatten,
  isEqual,
  takeRight
} from "lodash";

export enum ScopeLimiterRequirementOperator {
  In = "In",
  NotIn = "NotIn",
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

  // Checks whether the key/operator/values pair successfully resolves
  function validateRequirement({key, operator, values}: ScopeLimiterRequirement): boolean {
    if (!key.startsWith(`${scopeDomain}`)) {
      throw new Error(`key '${key}' is invalid: key does not start with '${scopeDomain}'`);
    }

    // Retrieve operator and validator functions from user operator input
    const { operator: operatorFunction, validator: validatorFunction } = operatorFunctions[operator];
    if (operatorFunction === undefined) {
      throw new Error(`Unknown operator '${operator}'`);
    }
    const scopeAnnotationValue = scanAnnotations[key];

    // Template the user values input using Mustache
    const findingValues = values.map(templateValue);
    // If one of the user values couldn't be rendered, fallback to user-defined behaviour
    if (findingValues.some(render => !render.rendered)) {
      return scopeLimiter.validOnMissingRender;
    }

    const props: Operands = {
      scopeAnnotationValue,
      // flatten is the values to get rid of nested lists (caused by our custom Mustache list function)
      findingValues: flatten(findingValues.map(render => render.values))
    };

    try {
      validatorFunction(props);
    } catch (error) {
      throw new Error(`using operator '${operator}': ${error.message}`);
    }

    return operatorFunction(props);
  }

  function templateValue(value: string): {values: string[], rendered: boolean} {
    if (value === undefined) return {
      values: [],
      rendered: true,
    };
    // First try to render scope limiter aliases
    let mapped = Mustache.render(value, {
      $: {
        ...scopeLimiterAliases
      }
    });
    // If it couldn't be rendered as an alias, try render it again with finding
    if (mapped == "") {
      mapped = value;
    }
    const delimiter = ";;;;"
    let rendered = Mustache.render(mapped, {
        ...finding,
        // These custom mustache functions all return a string containing a list delimited by `delimiter` defined above.
        "getValues": function () {
          // Select attributes inside a list of objects
          return function (text, render) {
            text = text.trim();
            const path = text.split(".");
            if (path.length < 3) {
              throw new Error(`Invalid list key '${text}'. List key must be at least 3 levels deep. E.g. 'attributes.addresses.ip'`)
            }
            const listKey = path.slice(0, path.length - 1).join(".");
            const objectKey = path.pop();
            return render(`{{#${listKey}}}{{${objectKey}}}${delimiter}{{/${listKey}}}`);
          }
        },
        "asList": function () {
          // Select a complete list
          return function (text, render) {
            text = text.trim();
            const path = text.split(".");
            if (path.length < 2) {
              throw new Error(`Invalid list key '${text}'. List key must be at least 2 levels deep. E.g. 'attributes.addresses'`)
            }
            return render(`{{#${text}}}{{.}}${delimiter}{{/${text}}}`);
          }
        },
        "split": function () {
          // Split an existing list by comma
          return function (text, render) {
            // We are using a regular expression of the comma delimiter instead of a straight comma because
            // NodeJS 14.X only replaces the first occurence when using the latter, and the
            // replaceAll function is only available starting with NodeJS 15.
            // First replace comma with trailing space in case the list is specified as "entry1, entry2".
            // Then replace any leftover commas without a space, in case the list format is "entry1,entry2".
            const result = render(text).trim().replace(/, /g, delimiter).replace(/,/g, delimiter);
            if (result === "" || result.endsWith(delimiter)) {
              return result;
            } else {
              return result.concat(delimiter)
            }
          }
        },
      }
    );
    // If the final render includes a delimiter, unpack the rendered string to an actual list
    if (rendered.includes(delimiter)) {
      let list = rendered.split(delimiter);
      // The last element is always an empty string
      list = list.slice(0, list.length - 1);
      return {
        values: list,
        rendered: list.every(value => value != ""),
      }
    } else {
      return {
        values: [rendered],
        rendered: rendered != "",
      }
    }
  }

  // All the different scope limiter fields must match (i.e. results of `allOf`, `anyOf`, `noneOf` are ANDed).
  // If one of those fields is not declared, regard it as matched.
  return [
    scopeLimiter.allOf !== undefined && scopeLimiter.allOf.length > 0 ? scopeLimiter.allOf.every(validateRequirement) : true,
    scopeLimiter.anyOf !== undefined && scopeLimiter.anyOf.length > 0 ? scopeLimiter.anyOf.some(validateRequirement) : true,
    scopeLimiter.noneOf !== undefined && scopeLimiter.noneOf.length > 0 ? !scopeLimiter.noneOf.some(validateRequirement) : true,
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

// This validator ensures that neither the scope annotation nor the finding values can be undefined
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

/**
 * The scope annotation value exists in one of the finding values.
 * Matching example:
 * scopeAnnotationValue: "example.com"
 * findingValues: ["example.com", "subdomain.example.com"]
 */
function operatorIn({scopeAnnotationValue, findingValues}: Operands): boolean {
  return findingValues.includes(scopeAnnotationValue);
}

/**
 * The scope annotation value is considered a comma-seperated list and checks if every finding value is in that list.
 * Matching example:
 * scopeAnnotationValue: "example.com,subdomain.example.com,other.example.com"
 * findingValues: ["example.com", "subdomain.example.com"]
 */
function operatorContains({scopeAnnotationValue, findingValues}: Operands): boolean {
  const scopeAnnotationValues = scopeAnnotationValue.split(",");
  return findingValues.every(findingValue => scopeAnnotationValues.includes(findingValue));
}

/**
 * The scope annotation value is considered CIDR and checks if every finding value is within the subnet of that CIDR.
 * Supports both IPv4 and IPv6. If the scope is defined in IPv4, will only validate IPv4 IPs in the finding values.
 * Vice-versa for IPv6 defined in scope and IPv4 found in values. Note that all IPs in finding values must be valid
 * addresses, regardless of whether IPv4 or IPv6 was used in the scope definition.
 * Matching example:
 * scopeAnnotationValue: "10.10.0.0/16"
 * findingValues: ["10.10.1.2", "10.10.1.3", "2001:0:ce49:7601:e866:efff:62c3:fffe"]
 */
function operatorInCIDR({scopeAnnotationValue, findingValues}: Operands): boolean {

  function getIPv4Or6(ipValue: string): Address4 | Address6 {
    try {
      return new Address4(ipValue);
    } catch (e) {
      if (e.name === "AddressError" && e.message === "Invalid IPv4 address.") {
        try {
          return new Address6(ipValue);
        } catch (e) {
          if (e.name === "AddressError" && e.message === "Invalid IPv6 address.") {
            throw new Error(`${ipValue} is neither a IPv4 or IPv6`);
          } else throw e;
        }
      } else throw e;
    }
  }

  let scopeAnnotationSubnet = getIPv4Or6(scopeAnnotationValue);


  return findingValues.every(findingValue => {
    const address = getIPv4Or6(findingValue);
    // Can't compare IPv4 with IPv6, so we return regard such comparison as true
    if (address.constructor !== scopeAnnotationSubnet.constructor) return true;

    return address.isInSubnet(scopeAnnotationSubnet);
  });
}

/**
 * Checks if every finding value is a subdomain of the scope annotation value.
 * Inclusive; i.e. example.com is a subdomain of example.com.
 * Matching example:
 * scopeAnnotationValue: "example.com"
 * findingValues: ["subdomain.example.com", "example.com"]
 */
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
