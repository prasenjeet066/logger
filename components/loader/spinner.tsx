"use client"

/**
 * Temporary shim to keep legacy `Spinner` imports working.
 * It re-exports the new `Loader` component so both
 *   import Loader from "@/components/loader/loader"
 * and
 *   import Spinner from "@/components/loader/spinner"
 * resolve correctly.
 *
 * Remove this file once all old `Spinner` imports
 * have been replaced with `Loader`.
 */

import Loader from "./loader"

export default Loader
export { Loader as Spinner }
