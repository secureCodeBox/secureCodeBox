// SPDX-FileCopyrightText: 2020 iteratec GmbH
//
// SPDX-License-Identifier: Apache-2.0

package io.securecodebox.persistence.mapping;

import io.securecodebox.persistence.defectdojo.config.DefectDojoConfig;
import io.securecodebox.persistence.defectdojo.models.Endpoint;
import io.securecodebox.persistence.defectdojo.models.Finding;
import io.securecodebox.persistence.defectdojo.service.EndpointService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DefectDojoFindingToSecureCodeBoxMapperTest {

  DefectDojoFindingToSecureCodeBoxMapper mapper;

  @Mock
  EndpointService endpointService;

  @BeforeEach
  public void setup(){
    var config = new DefectDojoConfig("http://example.defectdojo.com", "placeholder", "placeholder");
    this.mapper = new DefectDojoFindingToSecureCodeBoxMapper(config, endpointService);
  }

  @Test
  public void shouldMapBasicFindings(){
    // Typical ZAP Finding in DefectDojo
    var ddFinding = Finding.builder()
      .title("Content Security Policy (CSP) Header Not Set")
      .severity(Finding.Severity.Medium)
      .description("Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate certain types of attacks, including Cross Site Scripting (XSS) and data injection attacks. These attacks are used for everything from data theft to site defacement or distribution of malware. CSP provides a set of standard HTTP headers that allow website owners to declare approved sources of content that browsers should be allowed to load on that page â covered types are JavaScript, CSS, HTML frames, fonts, images and embeddable objects such as Java applets, ActiveX, audio and video files.\n\nReference: https://developer.mozilla.org/en-US/docs/Web/Security/CSP/Introducing_Content_Security_Policyhttps://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.htmlhttp://www.w3.org/TR/CSP/http://w3c.github.io/webappsec/specs/content-security-policy/csp-specification.dev.htmlhttp://www.html5rocks.com/en/tutorials/security/content-security-policy/http://caniuse.com/#feat=contentsecuritypolicyhttp://content-security-policy.com/\n\nURL: http://juice-shop.securecodebox-test.svc:3000/sitemap.xml\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/coupons_2013.md.bak\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/encrypt.pyc\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/suspicious_errors.yml\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/package.json.bak\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/eastere.gg\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000\nMethod: GET\n\nURL: http://juice-shop.securecodebox-test.svc:3000/ftp/quarantine\nMethod: GET\n")
      .mitigation("Ensure that your web server, application server, load balancer, etc. is configured to set the Content-Security-Policy header, to achieve optimal browser support: \"Content-Security-Policy\" for Chrome 25+, Firefox 23+ and Safari 7+, \"X-Content-Security-Policy\" for Firefox 4.0+ and Internet Explorer 10+, and \"X-WebKit-CSP\" for Chrome 14+ and Safari 6+.")
      // Random ids...
      .endpoints(List.of(1337L, 42L, 3L))
      .foundBy(List.of(3L))
      .test(42L)
      .impact("No impact provided")
      .build();

    when(endpointService.get(1337L)).thenReturn(Endpoint.builder().protocol("http").host("juice-shop.securecodebox-test.svc:3000").build());

    var actualFinding = this.mapper.fromDefectDojoFining(ddFinding);

    assertEquals(
      actualFinding.getName(),
      "Content Security Policy (CSP) Header Not Set"
    );

    assertEquals(
      actualFinding.getCategory(),
      "DefectDojo Imported Finding"
    );

    assertEquals(
      actualFinding.getSeverity(),
      io.securecodebox.persistence.models.Finding.Severities.Medium
    );

    assertEquals(
      actualFinding.getLocation(),
      "http://juice-shop.securecodebox-test.svc:3000"
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
