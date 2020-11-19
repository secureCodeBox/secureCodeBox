package io.securecodebox.persistence.defectdojo;

import lombok.Getter;

public enum TestType {
  API_TEST(1, "API Test"),
  STATIC_CHECK(2, "Static Check"),
  PEN_TEST(3, "Pen Test"),
  WEB_APPLICATION_TEST(4, "Web Application Test"),
  SECURITY_RESEARCH(5,"Security Research"),
  THREAT_MODELING(6, "Threat Modeling"),
  MANUAL_CODE_REVIEW(7, "Manual Code Review"),
  ;

  @Getter
  long id;
  @Getter
  String testType;

  TestType(long id, String testType) {
    this.id = id;
    this.testType = testType;
  }
}
