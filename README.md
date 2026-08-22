# Catenary curve

Pick two vertices and a sag length. You get a hanging spline. `catenary.ts` is the math `npm test` runs. `catenary.fs` is the Onshape feature, with those formulas copied by hand.

## What each file owns

`catenary.ts` owns `sampleCatenary`. `catenary.test.ts` imports that function only.

`catenary.fs` owns the Onshape feature. It has four primitives:

1. Dialog. Start vertex, end vertex, and sag length.
2. Sampling. Helpers named `hangDirection`, `coshSagRatio`, `solveK`, and `profile`, then a 33-point loop. Same names as the TypeScript.
3. `opFitSpline` through those points.
4. One linear manipulator at the chord midpoint. Direction is hang. Offset is sag.

Sag is the perpendicular drop of the curve midpoint below the chord. A horizontal chord is a true catenary. A sloped chord still hangs off the chord, not along world down.

## Test the math

Run this from the repo root:

```
npm test
```

Node 22 strips types. There is no build step.

## Run the feature in Onshape

1. Open a Feature Studio and paste in `catenary.fs`.
2. Add the feature to a Part Studio.
3. Pick a start vertex and an end vertex.
4. Drag the sag handle, or type a sag length.

Onshape does not run `npm test`. If the spline is wrong, change `catenary.ts`, rerun the tests, then copy the formulas into `catenary.fs` again.
