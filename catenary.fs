FeatureScript 2716;
import(path : "onshape/std/common.fs", version : "2716.0");

const SAMPLE_COUNT = 33;
const EPS_LENGTH = 1e-12 * meter;
const EPS_DIRECTION = 1e-12;
const EPS_RATIO = 1e-12;
const MIN_SAG = 1e-5 * meter;
const DOWN = vector(0, -1, 0);

annotation { "Feature Type Name" : "Catenary curve",
             "Manipulator Change Function" : "catenaryManipulatorChange" }
export const catenary = defineFeature(function(context is Context, id is Id, definition is map)
    precondition
    {
        annotation { "Name" : "Start", "Filter" : EntityType.VERTEX, "MaxNumberOfPicks" : 1 }
        definition.start is Query;

        annotation { "Name" : "End", "Filter" : EntityType.VERTEX, "MaxNumberOfPicks" : 1 }
        definition.end is Query;

        annotation { "Name" : "Sag" }
        isLength(definition.sag, NONNEGATIVE_LENGTH_BOUNDS);
    }
    {
        if (isQueryEmpty(context, definition.start))
        {
            throw regenError("Select a start vertex.", ["start"]);
        }
        if (isQueryEmpty(context, definition.end))
        {
            throw regenError("Select an end vertex.", ["end"]);
        }

        var A = evVertexPoint(context, { "vertex" : definition.start });
        var B = evVertexPoint(context, { "vertex" : definition.end });
        var chord = B - A;
        var L = norm(chord);
        if (L < EPS_LENGTH)
        {
            throw regenError("Start and end coincide.");
        }
        var hang = hangDirection(A, B);
        var k = solveK(definition.sag / L);
        var points = [];
        for (var i = 0; i < SAMPLE_COUNT; i += 1)
        {
            var t = i / (SAMPLE_COUNT - 1);
            points = append(points, (1 - t) * A + t * B + definition.sag * profile(t, k) * hang);
        }
        opFitSpline(context, id + "spline", { "points" : points });
        addManipulators(context, id, {
            "sagManipulator" : linearManipulator({
                "base" : (A + B) / 2,
                "direction" : hang,
                "offset" : definition.sag,
                "primaryParameterId" : "sag"
            })
        });
    });

export function catenaryManipulatorChange(context is Context, definition is map, newManipulators is map) returns map
{
    definition.sag = max(newManipulators["sagManipulator"].offset, MIN_SAG);
    return definition;
}

function hangDirection(A is Vector, B is Vector) returns Vector
{
    var u = normalize(B - A);
    var h = DOWN - dot(DOWN, u) * u;
    if (norm(h) < EPS_DIRECTION)
    {
        throw regenError("Chord is vertical: hang direction is undefined.");
    }
    return normalize(h);
}

function coshSagRatio(k is number) returns number
{
    return (cosh(k) - 1) / (2 * k);
}

function solveK(sagRatio is number) returns number
{
    if (sagRatio < EPS_RATIO)
    {
        return 0;
    }
    var hi = 1;
    while (coshSagRatio(hi) < sagRatio && hi < 512)
    {
        hi *= 2;
    }
    if (coshSagRatio(hi) < sagRatio)
    {
        throw regenError("Sag is too large for this chord.");
    }
    var lo = 0;
    for (var i = 0; i < 64; i += 1)
    {
        var mid = (lo + hi) / 2;
        if (coshSagRatio(mid) < sagRatio)
        {
            lo = mid;
        }
        else
        {
            hi = mid;
        }
    }
    return (lo + hi) / 2;
}

function profile(t is number, k is number) returns number
{
    if (k == 0)
    {
        return 4 * t * (1 - t);
    }
    return (cosh(k * (2 * t - 1)) - cosh(k)) / (1 - cosh(k));
}
