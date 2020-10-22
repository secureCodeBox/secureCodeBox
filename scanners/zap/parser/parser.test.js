const fs = require("fs");
const util = require("util");

// eslint-disable-next-line security/detect-non-literal-fs-filename
const readFile = util.promisify(fs.readFile);

const { parse } = require("./parser");

test("Parsing the juice-shop results.", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/juice-shop.xml",
    {
      encoding: "utf8"
    }
  );

  expect(await parse(fileContent)).toMatchSnapshot();
});

test("Parsing the example.com results.", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/example.com.xml",
    {
      encoding: "utf8"
    }
  );

  expect(await parse(fileContent)).toMatchSnapshot();
});

test("Parsing the docs.securecodebox.io results.", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/docs.securecodebox.io.xml",
    {
      encoding: "utf8"
    }
  );

  expect(await parse(fileContent)).toMatchSnapshot();
});

test("Parsing an empty result.", async () => {
  const fileContent = await readFile(
    __dirname + "/__testFiles__/not-found.xml",
    {
      encoding: "utf8"
    }
  );

  expect(await parse(fileContent)).toMatchInlineSnapshot(`Array []`);
});

test("Parsing a nginx result.", async () => {
  const fileContent = await readFile(__dirname + "/__testFiles__/nginx.xml", {
    encoding: "utf8"
  });

  expect(await parse(fileContent)).toMatchInlineSnapshot(`
    Array [
      Object {
        "attributes": Object {
          "host": "nginx.demo-apps.svc",
          "port": "80",
          "zap_confidence": "2",
          "zap_count": "2",
          "zap_cweid": "16",
          "zap_finding_urls": Array [
            Object {
              "method": "GET",
              "param": "X-Frame-Options",
              "uri": "http://nginx.demo-apps.svc",
            },
            Object {
              "method": "GET",
              "param": "X-Frame-Options",
              "uri": "http://nginx.demo-apps.svc/",
            },
          ],
          "zap_otherinfo": null,
          "zap_pluginid": "10020",
          "zap_reference": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options",
          "zap_riskcode": "2",
          "zap_solution": "Most modern Web browsers support the X-Frame-Options HTTP header. Ensure it's set on all web pages returned by your site (if you expect the page to be framed only by pages on your server (e.g. it's part of a FRAMESET) then you'll want to use SAMEORIGIN, otherwise if you never expect the page to be framed, you should use DENY. ALLOW-FROM allows specific websites to frame the web page in supported web browsers).",
          "zap_wascid": "15",
        },
        "category": "X-Frame-Options Header Not Set",
        "description": "X-Frame-Options header is not included in the HTTP response to protect against 'ClickJacking' attacks.",
        "hint": undefined,
        "location": "http://nginx.demo-apps.svc",
        "name": "X-Frame-Options Header Not Set",
        "osi_layer": "APPLICATION",
        "severity": "MEDIUM",
      },
      Object {
        "attributes": Object {
          "host": "nginx.demo-apps.svc",
          "port": "80",
          "zap_confidence": "3",
          "zap_count": "4",
          "zap_cweid": "200",
          "zap_finding_urls": Array [
            Object {
              "evidence": "nginx/1.19.3",
              "method": "GET",
              "uri": "http://nginx.demo-apps.svc/",
            },
            Object {
              "evidence": "nginx/1.19.3",
              "method": "GET",
              "uri": "http://nginx.demo-apps.svc/robots.txt",
            },
            Object {
              "evidence": "nginx/1.19.3",
              "method": "GET",
              "uri": "http://nginx.demo-apps.svc",
            },
            Object {
              "evidence": "nginx/1.19.3",
              "method": "GET",
              "uri": "http://nginx.demo-apps.svc/sitemap.xml",
            },
          ],
          "zap_otherinfo": null,
          "zap_pluginid": "10036",
          "zap_reference": "http://httpd.apache.org/docs/current/mod/core.html#servertokenshttp://msdn.microsoft.com/en-us/library/ff648552.aspx#ht_urlscan_007http://blogs.msdn.com/b/varunm/archive/2013/04/23/remove-unwanted-http-response-headers.aspxhttp://www.troyhunt.com/2012/02/shhh-dont-let-your-response-headers.html",
          "zap_riskcode": "1",
          "zap_solution": "Ensure that your web server, application server, load balancer, etc. is configured to suppress the \\"Server\\" header or provide generic details.",
          "zap_wascid": "13",
        },
        "category": "Server Leaks Version Information via \\"Server\\" HTTP Response Header Field",
        "description": "The web/application server is leaking version information via the \\"Server\\" HTTP response header. Access to such information may facilitate attackers identifying other vulnerabilities your web/application server is subject to.",
        "hint": undefined,
        "location": "http://nginx.demo-apps.svc",
        "name": "Server Leaks Version Information via \\"Server\\" HTTP Response Header Field",
        "osi_layer": "APPLICATION",
        "severity": "LOW",
      },
      Object {
        "attributes": Object {
          "host": "nginx.demo-apps.svc",
          "port": "80",
          "zap_confidence": "2",
          "zap_count": "2",
          "zap_cweid": "16",
          "zap_finding_urls": Array [
            Object {
              "method": "GET",
              "param": "X-Content-Type-Options",
              "uri": "http://nginx.demo-apps.svc",
            },
            Object {
              "method": "GET",
              "param": "X-Content-Type-Options",
              "uri": "http://nginx.demo-apps.svc/",
            },
          ],
          "zap_otherinfo": "This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still affected by injection issues, in which case there is still concern for browsers sniffing pages away from their actual content type.At \\"High\\" threshold this scan rule will not alert on client or server error responses.",
          "zap_pluginid": "10021",
          "zap_reference": "http://msdn.microsoft.com/en-us/library/ie/gg622941%28v=vs.85%29.aspxhttps://owasp.org/www-community/Security_Headers",
          "zap_riskcode": "1",
          "zap_solution": "Ensure that the application/web server sets the Content-Type header appropriately, and that it sets the X-Content-Type-Options header to 'nosniff' for all web pages.If possible, ensure that the end user uses a standards-compliant and modern web browser that does not perform MIME-sniffing at all, or that can be directed by the web application/web server to not perform MIME-sniffing.",
          "zap_wascid": "15",
        },
        "category": "X-Content-Type-Options Header Missing",
        "description": "The Anti-MIME-Sniffing header X-Content-Type-Options was not set to 'nosniff'. This allows older versions of Internet Explorer and Chrome to perform MIME-sniffing on the response body, potentially causing the response body to be interpreted and displayed as a content type other than the declared content type. Current (early 2014) and legacy versions of Firefox will use the declared content type (if one is set), rather than performing MIME-sniffing.",
        "hint": undefined,
        "location": "http://nginx.demo-apps.svc",
        "name": "X-Content-Type-Options Header Missing",
        "osi_layer": "APPLICATION",
        "severity": "LOW",
      },
      Object {
        "attributes": Object {
          "host": "nginx.demo-apps.svc",
          "port": "80",
          "zap_confidence": "2",
          "zap_count": "4",
          "zap_cweid": "16",
          "zap_finding_urls": Array [
            Object {
              "method": "GET",
              "uri": "http://nginx.demo-apps.svc/robots.txt",
            },
            Object {
              "method": "GET",
              "uri": "http://nginx.demo-apps.svc/",
            },
            Object {
              "method": "GET",
              "uri": "http://nginx.demo-apps.svc/sitemap.xml",
            },
            Object {
              "method": "GET",
              "uri": "http://nginx.demo-apps.svc",
            },
          ],
          "zap_otherinfo": null,
          "zap_pluginid": "10038",
          "zap_reference": "https://developer.mozilla.org/en-US/docs/Web/Security/CSP/Introducing_Content_Security_Policyhttps://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.htmlhttp://www.w3.org/TR/CSP/http://w3c.github.io/webappsec/specs/content-security-policy/csp-specification.dev.htmlhttp://www.html5rocks.com/en/tutorials/security/content-security-policy/http://caniuse.com/#feat=contentsecuritypolicyhttp://content-security-policy.com/",
          "zap_riskcode": "1",
          "zap_solution": "Ensure that your web server, application server, load balancer, etc. is configured to set the Content-Security-Policy header, to achieve optimal browser support: \\"Content-Security-Policy\\" for Chrome 25+, Firefox 23+ and Safari 7+, \\"X-Content-Security-Policy\\" for Firefox 4.0+ and Internet Explorer 10+, and \\"X-WebKit-CSP\\" for Chrome 14+ and Safari 6+.",
          "zap_wascid": "15",
        },
        "category": "Content Security Policy (CSP) Header Not Set",
        "description": "Content Security Policy (CSP) is an added layer of security that helps to detect and mitigate certain types of attacks, including Cross Site Scripting (XSS) and data injection attacks. These attacks are used for everything from data theft to site defacement or distribution of malware. CSP provides a set of standard HTTP headers that allow website owners to declare approved sources of content that browsers should be allowed to load on that page — covered types are JavaScript, CSS, HTML frames, fonts, images and embeddable objects such as Java applets, ActiveX, audio and video files.",
        "hint": undefined,
        "location": "http://nginx.demo-apps.svc",
        "name": "Content Security Policy (CSP) Header Not Set",
        "osi_layer": "APPLICATION",
        "severity": "LOW",
      },
    ]
  `);
});
