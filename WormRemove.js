/*
 * PJSR Script: BlurX + StarX workflow (cross-platform)
 * - Auto-detects AI models for RC-Astro on macOS (Core ML) and Windows (TensorFlow .pb)
 * - Steps: BlurX -> StarX(mask) -> undo x2 -> StarX(starless)
 * Author: ARZ, Kamil Waniczek  |  Version: 1.5  |  Date: 2025-09-15
 */

#feature-id WormRemove : Utilities > WormRemoval

#feature-info This script uses bxt and sxt in correct order to minimize the worms caused by nxt

#include <pjsr/Sizer.jsh>
#include <pjsr/NumericControl.jsh>

#define TITLE "Foraxx Palette Utility"
#define VERSION "1.15"
#define BUILD "202412230651"

#include "lib/DialogWormRemove.js"
// ---------- Utilities ----------

/** Return current user's home directory (PJSR API). */
function homeDir() { return File.homeDirectory; }

/** Join two path segments ensuring a single slash. */
function joinPath(a, b) { return a.endsWith("/") ? a + b : a + "/" + b; }

/** First existing path from list or null. */
function firstExistingPath(paths) {
   for (var i = 0; i < paths.length; i++) if (File.exists(paths[i])) return paths[i];
   return null;
}

/** Generate candidate full paths from base names, dirs and extensions. */
function candidatePaths(baseNames, dirs, exts) {
   var out = [];
   for (var d = 0; d < dirs.length; d++)
      for (var n = 0; n < baseNames.length; n++)
         for (var e = 0; e < exts.length; e++)
            out.push( joinPath(dirs[d], baseNames[n] + exts[e]) );
   return out;
}

// ---------- Model discovery config ----------

// Prefer newest first; dopisz jeśli masz nowsze.
var BLURX_BASES = ["BlurXTerminator.5", "BlurXTerminator.4", "BlurXTerminator.3"];
var STARX_BASES = ["StarXTerminator.12", "StarXTerminator.11", "StarXTerminator.10"];

let xtParameters = {
   sharpenStars: 0.65,
   sharpenNonstellar: 0.5,
   adjustHalos: 0,
   overlap: 0.5,
   correct: true,
   generateStarMask: true,
   view: undefined
}

var activeWindow = ImageWindow.activeWindow;
if (activeWindow && activeWindow.isWindow) {
   var activeView = activeWindow.currentView;
   if ( activeView ) {
      xtParameters.view = activeView;
   }
}

// Prefer CoreML, then TF .pb (Windows).
var EXTS = [".mlpackage", ".mlmodel", ".pb"];

/*
 * Common install locations:
 * - macOS:  /Applications/PixInsight/library, ~/Library/... , /Library/...
 * - Windows:
 *     C:/Program Files/PixInsight/library
 *     %APPDATA%/RC-Astro/...      -> home/AppData/Roaming/RC-Astro/...
 *     %PROGRAMDATA%/RC-Astro/...  -> C:/ProgramData/RC-Astro/...
 */
var COMMON_DIRS = [
   // macOS
   "/Applications/PixInsight/library",
   joinPath(homeDir(), "Library/Application Support/RC-Astro/BlurXTerminator"),
   joinPath(homeDir(), "Library/Application Support/RC-Astro/StarXTerminator"),
   "/Library/Application Support/RC-Astro/BlurXTerminator",
   "/Library/Application Support/RC-Astro/StarXTerminator",

   // Windows
   "C:/Program Files/PixInsight/library",
   joinPath(homeDir(), "AppData/Roaming/RC-Astro/BlurXTerminator"),
   joinPath(homeDir(), "AppData/Roaming/RC-Astro/StarXTerminator"),
   "C:/ProgramData/RC-Astro/BlurXTerminator",
   "C:/ProgramData/RC-Astro/StarXTerminator"
];

/**
 * Find first existing AI model file for given base names.
 * @param {string[]} baseNames - e.g., ["BlurXTerminator.5", "BlurXTerminator.4"]
 * @returns {string} absolute path
 * @throws if not found (lists checked paths)
 */
function resolveModel(baseNames) {
   var paths = candidatePaths(baseNames, COMMON_DIRS, EXTS);
   var found = firstExistingPath(paths);
   if (!found)
      throw new Error("Could not find an AI model file. Checked:\n" + paths.join("\n"));
   return found;
}

// ---------- Main pipeline ----------

/**
 * Run BlurXTerminator + StarXTerminator workflow on the active view.
 * Steps:
 *  1) BlurX (sharpen stars ~0.65)
 *  2) StarX with mask (stars=true)
 *  3) Undo last two steps
 *  4) StarX starless (stars=false)
 */
function main() {
   jsAutoGC = true;
   let dialog = new WormRemoveDialog;
   let dialogReturn = dialog.execute();
   if (dialogReturn) {
      var view = xtParameters.view;
      var win = view.window;
      if (win.isNull) throw new Error("No active image! Open an image first.");

      // Resolve model files (CoreML or TF)
      var blurxModel = resolveModel(BLURX_BASES);
      var starxModel = resolveModel(STARX_BASES);

      // BlurXTerminator (correct only)
      if (xtParameters.correct) {
         console.writeln("Starting BlurXterminator (correct only)!");
         var blurxCorrect = new BlurXTerminator;
         blurxCorrect.ai_file = blurxModel;
         blurxCorrect.correct_only = xtParameters.correct;
         blurxCorrect.correct_first = false;
         blurxCorrect.nonstellar_then_stellar = false;
         blurxCorrect.lum_only = false;
         blurxCorrect.sharpen_stars = 0.00;
         blurxCorrect.adjust_halos = 0.00;
         blurxCorrect.nonstellar_psf_diameter = 0.00;
         blurxCorrect.auto_nonstellar_psf = true;
         blurxCorrect.sharpen_nonstellar = 0.00;
         if (!blurxCorrect.executeOn(view)) throw new Error("BlurXTerminator (correct only) step failed.");
      }

      if (xtParameters.generateStarMask) {
         // BlurXTerminator (stars)
         console.writeln("Starting BlurXterminator (stars)!");
         var blurx = new BlurXTerminator;
         blurx.ai_file = blurxModel;
         blurx.correct_only = false;
         blurx.correct_first = false;
         blurx.nonstellar_then_stellar = false;
         blurx.lum_only = false;
         blurx.sharpen_stars = xtParameters.sharpenStars;
         blurx.adjust_halos = xtParameters.adjustHalos;
         blurx.nonstellar_psf_diameter = 0.00;
         blurx.auto_nonstellar_psf = true;
         blurx.sharpen_nonstellar = 0.00;
         if (!blurx.executeOn(view)) throw new Error("BlurXTerminator (stars) step failed.");

         // StarXTerminator (mask)
         console.writeln("Starting StarXterminator (mask)!");
         var starxMask = new StarXTerminator;
         starxMask.ai_file = starxModel;
         starxMask.stars = true;     // generate mask / stars pass
         starxMask.unscreen = false;
         starxMask.overlap = xtParameters.overlap;
         if (!starxMask.executeOn(view)) throw new Error("StarX (mask) step failed.");

         // Undo two steps
         win.undo(); win.undo();
      }

      // StarXTerminator (starless)
      console.writeln("Starting StarXterminator (starless)!");
      var starxNoMask = new StarXTerminator;
      starxNoMask.ai_file = starxModel;
      starxNoMask.stars = false;  // starless
      starxNoMask.unscreen = false;
      starxNoMask.overlap = xtParameters.overlap;
      if (!starxNoMask.executeOn(view)) throw new Error("StarX (starless) step failed.");

      // BlurXTerminator (nonstellar)
      if (xtParameters.sharpenNonstellar) {
         console.writeln("Starting BlurXterminator (nonstellar)!");
         var blurxObject = new BlurXTerminator;
         blurxObject.ai_file = blurxModel;
         blurxObject.correct_only = false;
         blurxObject.correct_first = false;
         blurxObject.nonstellar_then_stellar = false;
         blurxObject.lum_only = false;
         blurxObject.sharpen_stars = 0.00;
         blurxObject.adjust_halos = 0.00;
         blurxObject.nonstellar_psf_diameter = 0.00;
         blurxObject.auto_nonstellar_psf = true;
         blurxObject.sharpen_nonstellar = xtParameters.sharpenNonstellar;
         if (!blurxObject.executeOn(view)) throw new Error("BlurXTerminator (object) step failed.");
      }

      console.writeln("✅ Processing complete!");
   }
}

main();
