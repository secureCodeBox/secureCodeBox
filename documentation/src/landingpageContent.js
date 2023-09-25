// SPDX-FileCopyrightText: the secureCodeBox authors
//
// SPDX-License-Identifier: Apache-2.0

const content = {
  automatedTesting: {
    cards: [
      {
        title: "Powerful Scanning Tools",
        description:
          "Combines more than 15 different Scanners to provide a comprehensive overview of threats and vulnerabilities affecting your network and applications.",
        imgSrc: "/img/features/scanning.svg",
      },
      {
        title: "SDLC",
        description:
          "Easily integrate the secureCodeBox into your CI/CD pipeline or Kubernetes environment with automated feedbacks.",
        imgSrc: "/img/features/sdlc.svg",
      },
      {
        title: "Multi-Layer Testing",
        description:
          "Allowing security tests on different layers – from deep dive Scans of single Applications to large-scale scanning of complete it landscapes.",
        imgSrc: "/img/features/testing.svg",
      },
      {
        title: "Easy Monitoring",
        description:
          "Easily monitor each scanner's results through pre-designed or customised dashboards, use a tool integration such as. DefectDojo or integrate persistence tool of your choice.",
        imgSrc: "/img/features/monitoring.svg",
      },
    ],
  },
  useCases: {
    title: "Security Use Cases",
    description:
      "Flexible configuration options make it possible to apply the secureCodeBox to a wide range of use cases, addressing security professionals as well as DevOps Teams. Discover the possibilities:",
    items: [
      {
        title: "For Dev-Teams:",
        content:
          "Scan your applications to identify low-hanging fruit issues in an early stage during the development process and free the resources of pen-testers to concentrate on major security issues.",
      },
      {
        title: "For Ops-Teams:",
        content:
          "Orchestrate and perform continuous and automated routine scans of your applications in the live environment and thereby reduce vulnerability risks.",
      },
      {
        title: "For Sec-Teams:",
        content:
          "Use the secureCodeBox to run security scans on large-scale networks and identify vulnerabilities alongside your organization’s infrastructure.",
      },
    ],
  },
  goToSolution: {
    title: "Your Go-to Solution for easy Security Scanning",
    description:
      "secureCodeBox offers a well-documented and beginner-friendly introduction to the world of DevSecOps:",
    image: "/img/Desktop_Screenshots.png",
    list: [
      {
        label: "Quick & easy installation",
        content:
          "It's a quick and straight forward installation. It works on every system and is ready to use from start.",
      },
      {
        label: "For professionals and rookies",
        content:
          "You can start scans without any configuration right away and use best practice tests. But each scanner also provides extensive configuration options.",
      },
      {
        label: "Plug-and-play Architecture",
        content:
          "Our architecture is designed for open flexibility and free adjustments. New tools can be integrated fairly simple and you can design your own scan and monitor process.",
      },
      {
        label: "Fully scalable",
        content:
          "Separately configurable for multiple teams, systems or clusters.",
      },
    ],
  },
  multiScanner: {
    title: "Multi Scanner Security Platform",
    description:
      "Combining more than 15 leading Open-Source Scanning Tools secureCodeBox covers a broad spectrum of possible threats and vulnerabilities for your network and applications; ranging from Kubernetes vulnerabilities, over SSL misconfigurations, to network authentication bruteforcing and many more:",
  },
  about: {
    title: "About us",
    description:
      "secureCodeBox is an Open-Source project in cooperation with OWASP and with friendly support from",
    question: "Do you have questions or feedback about secureCodeBox?",
    buttonHeader: "Get in contact and let us know:",
    button: "Get in contact",
    mail: {
      recipient: "securecodebox@iteratec.com",
      subject: "",
      message: "",
    },
    roles: [
      {
        imageSrc: "/img/roles/rfe_hoch_cropped.jpg",
        name: "Robert Felber",
        role: "Inventor",
      },
      {
        imageSrc: "/img/roles/sst_hoodie_hoch_cropped.jpg",
        name: "Sven Strittmatter",
        role: "Core Team",
      },
      {
        imageSrc: "/img/roles/jh_small.jpg",
        name: "Jannik Hollenbach",
        role: "Core Team",
      },
    ],
  },
  sponsors: {
    title: "Sponsors",
    logos: [
      {
        srcLight: "/img/Logo_iteratec_rgb_black_SZ_rz.svg",
        srcDark: "/img/Logo_iteratec_rgb_white_SZ_rz.svg",
        link: "https://www.iteratec.com/",
      },
      {
        srcLight: "/img/sponsors/Logo_sda-se.png",
        srcDark: "/img/sponsors/Logo_sda-se.png",
        link: "https://sda.se/",
      },
      {
        srcLight: "/img/sponsors/Logo_secura.svg",
        srcDark: "/img/sponsors/Logo_secura.svg",
        link: "https://www.secura.com/",
      },
      {
        srcLight: "/img/sponsors/Logo_signal-iduna.svg",
        srcDark: "/img/sponsors/Logo_signal-iduna.svg",
        link: "https://www.signal-iduna.de/",
      },
      {
        srcLight: "/img/sponsors/Logo_timo-pagel-it-consulting.png",
        srcDark: "/img/sponsors/Logo_timo-pagel-it-consulting.png",
        link: "https://pagel.pro/",
      },
    ],
  },
};

export default content;
