
import Konva from "konva";
import { createMachine, interpret } from "xstate";
import undoManager from './undoManager';

let buttonUndo = document.getElementById("undo")
let buttonRedo = document.getElementById("redo")

let undomanager = new undoManager();

undoButton.addEventListener("click", () => { undoManager.undo() })
redoButton.addEventListener("click", () => {undoManager.redo() })
const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});
// Une couche pour le dessin
const dessin = new Konva.Layer();
// Une couche pour la polyline en cours de construction
const temporaire = new Konva.Layer();
stage.add(dessin);
stage.add(temporaire);

const MAX_POINTS = 10;
let polyline // La polyline en cours de construction;



const polylineMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiAIwAWAGxEArAGYAHDo0AmA3x2qNqxRoA0ITEoCciosoDsRg-Zf6DWg4pcAvgE2aFh4hETSYAAKqATi1PTMbJy8grJoYpLSsgoIFvZEOpbKij5l9jou9jZ2CIqOzm4+Ospa1YZ8qkEhGDgExFGx8YmMTLQAakz8QkggmRJSMnN5rlpE9ho69j5aWpVtLta2SnxOBjpaDRcWygZqOj3zfeGDhMP4CUywAMYAhsgwDMMqJFjkVkpVAZnNt2mV9tVfFpaohfHwigYNG0NOZVEcdAYnqF+hEALZ-fCYD7iWCjZIcbjAuYLbLLUB5RSWaF45TmDR8LTmLTKFEIAyqHSaDQqaqVHHS4VEl4DIjkynU2m0MYpRmKWYiLJLXJKGVEVRtAwuVT7S1Q5EnBDtFxmwxXK7mfyBYLPMIqtVUuKfTVJcY0KZMg1gtnyE2Ys2qKFuQxY3kuUWKM5EC5XHamFT3L29X1kikB+K077-QER56G8HsxA6PjQ-nVI5bI5qAyi-ZFNxQ+xteyCsqFn0k4j+jUUJifMAAJxrLKNEIQO0KVWagtMwpMooAtBnnJyju1lMpLlaJUri5PS9OAEJ-H4Aa1gyGfQPSzNBrONCBcRR1DadpLgTXkeR7YwMSxQVcXxQlvWJV5VXvQMaQoJ9X3fT8eD1EE62jPJ+UlXlSjODQXD2MpFB7PhCkAkDLAlNQXDHZCVSGdCKDofAIFQJdfxXBsEFKZ0NE8Qd7AoqirRFB0sWdO5tFhK4M1aG8JxIMhKF4-jBMI-8nC2cU9k8Pw8XsCUdFFCUnB2FTikvBpNJQqd0NpPSBO-SM-1XexhyIRRdF8TYGiA-xRUMQptDMVsvF3DQgm9fBUAgOAQVvAio3-fc1GPKiE2bBLjHtOp908TQvFKUpKMqXR2OVCJSHIbK-JE4yCWtBELOqazRT8ZQsy2VRPFKKogMVJCmreGJ0La4SY0dFwhv2C8+AkkxStoh1BuG0wxsUCbrWUVy-TQ8sFvrJb6qII56Paa1MT0AaVDNRFOQFfYqkHZKAiAA */
        id: "polyLine",
        initial: "idle",
        states: {
            idle: {
                on: {
                    MOUSECLICK: {
                        target: "onePoint",
                        actions: "createLine",
                    },

                    Undo: {
                        target: "idle",
                        internal: true
                    }
                },
            },

            onePoint: {
                on: {
                    MOUSECLICK: {
                        target: "manyPoints",
                        actions: "addPoint",
                    },

                    MOUSEMOVE: {
                        actions: "setLastPoint",
                    },

                    Escape: { // event.key
                        target: "idle",
                        actions: "abandon",
                    },

                    Undo: {
                        target: "onePoint",
                        internal: true
                    }
                },
            },

            manyPoints: {
                on: {
                    MOUSECLICK: [
                        {
                            actions: "addPoint",
                            cond: "pasPlein",
                        },
                        {
                            target: "idle",
                            actions: ["addPoint", "saveLine"],
                        },
                    ],

                    MOUSEMOVE: {
                        actions: "setLastPoint",
                    },

                    Escape: {
                        target: "idle",
                        actions: "abandon",
                    },

                    Enter: { // event.key
                        target: "idle",
                        actions: "saveLine",
                    },

                    Backspace: [ // event.key
                        {
                            target: "manyPoints",
                            actions: "removeLastPoint",
                            cond: "plusDeDeuxPoints",
                            internal: true,
                        },
                        {
                            target: "onePoint",
                            actions: "removeLastPoint",
                        },
                    ],

                    Undo: {
                        target: "manyPoints",
                        internal: true
                    }
                },
            }
        },
    },
    {
        actions: {
            createLine: (context, event) => {
                const pos = stage.getPointerPosition();
                polyline = new Konva.Line({
                    points: [pos.x, pos.y, pos.x, pos.y],
                    stroke: "red",
                    strokeWidth: 2,
                });
                temporaire.add(polyline);
            },
            setLastPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;

                const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
                polyline.points(newPoints.concat([pos.x, pos.y]));
                temporaire.batchDraw();
            },
            saveLine: (context, event) => {
                polyline.remove(); // On l'enlève de la couche temporaire
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                // Le dernier point(provisoire) ne fait pas partie de la polyline
                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints);
                polyline.stroke("black"); // On change la couleur
                // On sauvegarde la polyline dans la couche de dessin
                dessin.add(polyline); // On l'ajoute à la couche de dessin
                stackundo.push(polyline)//on l'ajoute a la couche de polyline
            },
            addPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
                polyline.points(newPoints); // Set the updated points to the line
                temporaire.batchDraw(); // Redraw the layer to reflect the changes
            },
            abandon: (context, event) => {
                polyline.remove();
            },
            removeLastPoint: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
                const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
                polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
                temporaire.batchDraw(); // Redraw the layer to reflect the changes
            },

            

        },
        guards: {
            pasPlein: (context, event) => {
                // On peut encore ajouter un point
                return polyline.points().length < MAX_POINTS * 2;
            },
            plusDeDeuxPoints: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return polyline.points().length > 6;
            },
        },
    }
);

const polylineService = interpret(polylineMachine)
    .onTransition((state) => {
        console.log("Current state:", state.value);
    })
    .start();

stage.on("click", () => {
    polylineService.send("MOUSECLICK");
});

stage.on("mousemove", () => {
    polylineService.send("MOUSEMOVE");
});

window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    polylineService.send(event.key);
});
