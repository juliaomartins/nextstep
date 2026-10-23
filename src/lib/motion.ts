"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/** Every NextStep animation runs only inside this query, so reduced-motion users get none. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export { gsap, useGSAP };
