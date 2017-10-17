# secureCodeBox – Continuous Secure Delivery Out of the Box 

![secureCodeBox](img/logo.png "secureCodeBox")

> _secureCodeBox_ is a docker based modularized toolchain for continuous security scans of your software project.

## Table of contents

<!-- toc -->
- [Purpose of this Project](#purpose-of-this-Project)
- [How does it Works](#how-does-it-Works)
- [Roadmap](#Roadmap)
- [Architecture](#architecture)
<!-- tocstop -->

## Purpose of this Project

The typical way to ensure application security is to hire a security specialist (aka. penetration tester) at some point in your project to check the application for security bugs and vulneribilities. Usualy this happens very late in the project. This has some drawbacks:

1. Nowadays lot of projects do continuous delivery, which means multiple deployments a day. The penetretaion tester can only check the application at a given snapshot in this development process. But some commits later there mey be new security issues introduced. So in conseuence a penetration tester should also continuously check the application. But this is not affordable.
2. The penetration tester may be bothered with simple to fix (low hanging fruit) issues and maybe will not even go to the serious security issues in the typically time boxed analysis.

With the _secureCodeBox_ we provide a toolchain for continuously scan applications to find the low-hanging fruit issues in the development process. So that a penetration tester can concentrate on the major security issues.

It **is not** the purpose of *secureCodeBox* to make penetration testers obsolete. We strongly recommend that you let check your application by one!

## How does it Works

TODO

## Roadmap

TODO

## Architecture

TODO