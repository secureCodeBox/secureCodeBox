# secureCodeBox – Continuous Secure Delivery Out of the Box 

![secureCodeBox](img/logo.png "secureCodeBox")

> *secureCodeBox* is a docker based modularized toolchain for continuous security scans of your software project.

## Table of contents

<!-- toc -->
- [Purpose of this Project](#purpose-of-this-Project)
- [How does it Works](#how-does-it-Works)
- [Roadmap](#Roadmap)
- [Architecture](#architecture)
<!-- tocstop -->

## Purpose of this Project

The typical way to ensure yours application security is to hire a security specialist
(aka. pen-tester) at some point in your project to check your application. Usualy very 
late in the project. This has some drawbacks:

1. Nowadays lot of projects to continuous delivery, which means multiple deployments a 
   day. The pen-tester can only check the application at a given snapshot in this development 
   process. But some commits later there mey be new security issues introduced. So a 
   pen-tester should also continuously check the application. But this is economicly not 
   affordable.
2. The pen-tester may be bothered with simple to fix low-hanging-fruit issues and will
   not maybe will not even go to the serious security issues.

With the *secureCodeBox* we provide a toolchain for continuously scan for the low-hanging
fruit in your development process, so that a pen-tester can concentrate on the major
security issues.

The purpose of *secureCodeBox* is not to make pen-testers obsolete. We strongly recommend
that you let check your application by one!

## How does it Works

TODO

## Roadmap

TODO

## Architecture

TODO