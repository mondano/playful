import { createMachine, interpret } from "xstate";

const isEmpty = function (arr) {
  return arr.length === 0;
};

const notEmpty = function (arr) {
  return arr.length > 0;
};

function compareBids(a, b) {
  return a.priority - b.priority;
}

class EventDictionary {
  constructor() {
    this.mapping = {};
  }

  addEventReference(eventType, narrativeName) {
    if (!this.mapping[eventType]) {
      this.mapping[eventType] = [];
    }
    this.mapping[eventType].push(narrativeName);
  }

  getNarrativesForEvent(eventType) {
    return this.mapping[eventType] || [];
  }
}

class Simulation {
  constructor() {
    this.running = [];
    this.pending = [];
    this.lastEvent = undefined;
    this.disabled = []; // List of currently disabled elements
    this.eventDictionary = new EventDictionary();
  }

  // ... (other methods remain the same)

  addNarrative(name, prio, stateMachineConfig) {
    const simulation = this;
    const machine = createMachine(stateMachineConfig, {
      actions: {
        updateLastEvent: (context, event) => {
          simulation.lastEvent = event.data;
        },
      },
    });

    const service = interpret(machine)
      .onTransition((state, event) => {
        if (state.changed) {
          simulation.run();
        }
      })
      .start();

    const bid = {
      name: name,
      priority: prio,
      service: service,
    };

    this.running.push(bid);
  }

  request(e) {
    // ... (same as the original code)
  }

  run(onUpdate) {
    // ... (same as the original code)
  }

  selectNextEvent() {
    // ... (same as the original code)
  }
}

export default Simulation;
