// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.mapping;

import io.securecodebox.persistence.defectdojo.config.Config;
import io.securecodebox.persistence.defectdojo.model.Endpoint;
import io.securecodebox.persistence.defectdojo.model.Finding;
import io.securecodebox.persistence.defectdojo.service.EndpointService;
import io.securecodebox.persistence.defectdojo.service.FindingService;
import io.securecodebox.persistence.models.SecureCodeBoxFinding;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DefectDojoFindingToSecureCodeBoxMapperTest {

  DefectDojoFindingToSecureCodeBoxMapper mapper;

  @Mock
  EndpointService endpointService;

  @Mock
  FindingService findingService;

  @Mock
  Config config;

  Finding exampleFinding;

  @BeforeEach
  public void setup() {
    this.mapper = new DefectDojoFindingToSecureCodeBoxMapper(config, endpointService, findingService);

    this.exampleFinding = Finding.builder()
      .title("Content Security Policy (CSP) Header Not Set")
      .severity(Finding.Severity.Medium)
      .description("Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate certain types of attacks, including Cross Site Scripting (XSS) and data injection attacks. These attacks are used for everything from data theft to site defacement or distribution of malware. CSP provides a set of standard HTTP headers that allow website owners to declare approved sources of content that browsers should be allowed to load on that page â covered types are JavaScript, CSS, HTML frames, fonts, images and embeddable objects such as Java applets, ActiveX, audio and video files.\n\nReference: https://developer.mozilla.org/en-US/docs/Web/Security/CSP/Introducing_Content_Security_Policyhttps://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.htmlhttp://www.w3.org/TR/CSP/http://w3c.github.io/webappsec/specs/content-security-policy/csp-specification.dev.htmlhttp://www.html5rocks.com/en/tutorials/security/content-security-policy/http://caniuse.com/#feat=contentsecuritypolicyhttp://content-security-policy.com/\n\nURL: http://juice-shop.securecodebox-test.svc:3000/sitemap.xml\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/coupons_2013.md.bak\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/encrypt.pyc\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/suspicious_errors.yml\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/package.json.bak\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/eastere.gg\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/quarantine\nMethod: GET\n")
      .mitigation("Ensure that your web server, application server, load balancer, etc. is configured to set the Content-Security-Policy header, to achieve optimal browser support: \"Content-Security-Policy\" for Chrome 25+, Firefox 23+ and Safari 7+, \"X-Content-Security-Policy\" for Firefox 4.0+ and Internet Explorer 10+, and \"X-WebKit-CSP\" for Chrome 14+ and Safari 6+.")
      // Random ids...
      .createdAt(OffsetDateTime.ofInstant(Instant.parse("2020-04-15T20:08:18.000Z"), ZoneId.systemDefault()))
      .endpoints(List.of(1337L, 42L, 3L))
      .foundBy(List.of(3L))
      .test(42L)
      .impact("No impact provided")
      .build();
  }

  @Test
  public void shouldMapBasicFindings() {
    // Typical ZAP Finding in DefectDojo
    var ddFinding = exampleFinding;

    when(endpointService.get(1337L)).thenReturn(Endpoint.builder().protocol("http").host("juice-shop.securecodebox-test.svc:3000").build());

    var actualFinding = this.mapper.fromDefectDojoFinding(ddFinding);

    assertEquals(
      "Content Security Policy (CSP) Header Not Set",
      actualFinding.getName()
    );

    assertEquals(
      "DefectDojo Imported Finding",
      actualFinding.getCategory()
    );

    assertEquals(
      SecureCodeBoxFinding.Severities.MEDIUM,
      actualFinding.getSeverity()
    );

    assertEquals(
      "http://juice-shop.securecodebox-test.svc:3000",
      actualFinding.getLocation()
    );

    assertEquals(
      "2020-04-15T20:08:18Z",
      actualFinding.getParsedAt()
    );
  }

  @Test
  public void shouldIncludeOriginalDuplicateFindingInAttributes() {
    // Typical ZAP Finding in DefectDojo
    var ddFinding = exampleFinding;

    ddFinding.setDuplicate(true);
    ddFinding.setDuplicateFinding(7L);

    var originalFinding = Finding.builder()
      .id(7L)
      .title("Content Security Policy (CSP) Header Not Set")
      .severity(Finding.Severity.Medium)
      .description("Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate certain types of attacks, including Cross Site Scripting (XSS) and data injection attacks. These attacks are used for everything from data theft to site defacement or distribution of malware. CSP provides a set of standard HTTP headers that allow website owners to declare approved sources of content that browsers should be allowed to load on that page â covered types are JavaScript, CSS, HTML frames, fonts, images and embeddable objects such as Java applets, ActiveX, audio and video files.\n\nReference: https://developer.mozilla.org/en-US/docs/Web/Security/CSP/Introducing_Content_Security_Policyhttps://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.htmlhttp://www.w3.org/TR/CSP/http://w3c.github.io/webappsec/specs/content-security-policy/csp-specification.dev.htmlhttp://www.html5rocks.com/en/tutorials/security/content-security-policy/http://caniuse.com/#feat=contentsecuritypolicyhttp://content-security-policy.com/\n\nURL: http://juice-shop.securecodebox-test.svc:3000/sitemap.xml\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/coupons_2013.md.bak\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/encrypt.pyc\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/suspicious_errors.yml\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/package.json.bak\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/eastere.gg\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/quarantine\nMethod: GET\n")
      .mitigation("Ensure that your web server, application server, load balancer, etc. is configured to set the Content-Security-Policy header, to achieve optimal browser support: \"Content-Security-Policy\" for Chrome 25+, Firefox 23+ and Safari 7+, \"X-Content-Security-Policy\" for Firefox 4.0+ and Internet Explorer 10+, and \"X-WebKit-CSP\" for Chrome 14+ and Safari 6+.")
      // Random ids...
      .createdAt(OffsetDateTime.ofInstant(Instant.parse("2020-02-15T20:08:18.000Z"), ZoneId.systemDefault()))
      .endpoints(List.of(1337L, 42L, 3L))
      .foundBy(List.of(3L))
      .test(40L)
      .impact("No impact provided")
      .build();

    when(endpointService.get(1337L)).thenReturn(Endpoint.builder().protocol("http").host("juice-shop.securecodebox-test.svc:3000").build());
    when(findingService.get(7L)).thenReturn(originalFinding);

    var actualFinding = this.mapper.fromDefectDojoFinding(ddFinding);

    assertEquals(
      7L,
      actualFinding.getAttributes().get("defectdojo.org/original-finding-id")
    );
    assertEquals(
      "Content Security Policy (CSP) Header Not Set",
      ((SecureCodeBoxFinding) actualFinding.getAttributes().get("defectdojo.org/original-finding")).getName()
    );
    assertNotNull(
      actualFinding.getAttributes().get("defectdojo.org/original-finding")
    );
  }

  @Test
  public void shouldNotBeStuckInARecursiveLoop() {
    // Typical ZAP Finding in DefectDojo
    var ddFinding = exampleFinding;

    ddFinding.setDuplicate(true);
    ddFinding.setDuplicateFinding(7L);

    var originalFinding = Finding.builder()
      .id(7L)
      .title("Content Security Policy (CSP) Header Not Set")
      .severity(Finding.Severity.Medium)
      .description("Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate certain types of attacks, including Cross Site Scripting (XSS) and data injection attacks. These attacks are used for everything from data theft to site defacement or distribution of malware. CSP provides a set of standard HTTP headers that allow website owners to declare approved sources of content that browsers should be allowed to load on that page â covered types are JavaScript, CSS, HTML frames, fonts, images and embeddable objects such as Java applets, ActiveX, audio and video files.\n\nReference: https://developer.mozilla.org/en-US/docs/Web/Security/CSP/Introducing_Content_Security_Policyhttps://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.htmlhttp://www.w3.org/TR/CSP/http://w3c.github.io/webappsec/specs/content-security-policy/csp-specification.dev.htmlhttp://www.html5rocks.com/en/tutorials/security/content-security-policy/http://caniuse.com/#feat=contentsecuritypolicyhttp://content-security-policy.com/\n\nURL: http://juice-shop.securecodebox-test.svc:3000/sitemap.xml\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/coupons_2013.md.bak\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/encrypt.pyc\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/suspicious_errors.yml\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/package.json.bak\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/eastere.gg\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/quarantine\nMethod: GET\n")
      .mitigation("Ensure that your web server, application server, load balancer, etc. is configured to set the Content-Security-Policy header, to achieve optimal browser support: \"Content-Security-Policy\" for Chrome 25+, Firefox 23+ and Safari 7+, \"X-Content-Security-Policy\" for Firefox 4.0+ and Internet Explorer 10+, and \"X-WebKit-CSP\" for Chrome 14+ and Safari 6+.")
      // Random ids...
      .createdAt(OffsetDateTime.ofInstant(Instant.parse("2020-02-15T20:08:18.000Z"), ZoneId.systemDefault()))
      .endpoints(List.of(1337L, 42L, 3L))
      .foundBy(List.of(3L))
      .test(40L)
      .impact("No impact provided")
      .duplicate(true)
      .duplicateFinding(2L)
      .build();

    when(findingService.get(7L)).thenReturn(originalFinding);

    var exception = Assertions.assertThrows(RuntimeException.class, () -> this.mapper.fromDefectDojoFinding(ddFinding));

    assertEquals(
      "Duplicate finding does not point to the actual original finding, as the original finding (id: 7) is also a duplicate. This should never happen.",
      exception.getMessage()
    );
  }

  @Test
  public void shouldProperlyParseEndpoints() {
    assertEquals(
      "tcp://45.33.32.156",
      DefectDojoFindingToSecureCodeBoxMapper.stringifyEndpoint(
        Endpoint.builder().protocol("tcp").host("45.33.32.156").build()
      ),
      "should parse simple nmap / tcp urls"
    );

    assertEquals(
      "http://juice-shop.securecodebox-test.svc:3000",
      DefectDojoFindingToSecureCodeBoxMapper.stringifyEndpoint(
        Endpoint.builder().protocol("http").host("juice-shop.securecodebox-test.svc:3000").build()
      ),
      "should parse endpoint with protocol and host with embedded port"
    );

    assertEquals(
      "http://juice-shop.securecodebox-test.svc:3000/",
      DefectDojoFindingToSecureCodeBoxMapper.stringifyEndpoint(
        Endpoint.builder().protocol("http").host("juice-shop.securecodebox-test.svc:3000").path("/").build()
      ),
      "should parse endpoint with a path set"
    );

    // DefectDojo sometimes outputs really weirdly parsed endpoints
    // these are not great, but probably not worth to spend too much time on parsing that on out end
    assertEquals(
      "//http://juice-shop.securecodebox-test.svc:3000:3000",
      DefectDojoFindingToSecureCodeBoxMapper.stringifyEndpoint(
        Endpoint.builder().host("http://juice-shop.securecodebox-test.svc:3000:3000").build()
      )
    );
  }
}
