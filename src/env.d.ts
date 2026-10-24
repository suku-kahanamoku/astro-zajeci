/// <reference types="astro/client" />
declare namespace App {
  interface Locals {
    session: import("./modules/CoreModule/types").Session | null;
  }
}
