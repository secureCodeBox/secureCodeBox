// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

function capitalizeFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function capitalizeEach(string) {
  let splitStr = string.toLowerCase().split(' ');
  for (var i = 0; i < splitStr.length; i++) {
    // You do not need to check if i is larger than splitStr length, as your for does that for you
    // Assign it back to the array
    splitStr[i] =
      splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  // Directly return the joined string
  return splitStr.join(' ');
}

function removeWhitespaces(string) {
  return string.replace(/\\s+/g, '');
}

module.exports = {
  capitalizeFirst,
  capitalizeEach,
  removeWhitespaces,
};
