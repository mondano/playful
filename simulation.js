import { v4 as uuid } from "uuid";

const isEmpty = function (arr) {
  return arr.length == 0;
};

const notEmpty = function (arr) {
  return arr.length > 0;
};

function compareBids(a, b) {
  return a.priority - b.priority;
}

class EventDictionary {
  constructor() {
    this.mapping = new Map();
  }

  addEventReference(eventType, narrativeRef) {
    if (!this.mapping.has(eventType)) {
      this.mapping.set(eventType, []);
    }
    this.mapping.get(eventType).push(narrativeRef);
  }

  getNarrativesForEvent(eventType) {
    return this.mapping.get(eventType) || [];
  }

  removeEventReference(eventType, narrativeRef) {
    if (this.mapping.has(eventType)) {
      const refs = this.mapping.get(eventType);
      const index = refs.indexOf(narrativeRef);
      if (index !== -1) {
        refs.splice(index, 1);
        if (refs.length === 0) {
          this.mapping.delete(eventType);
        }
      }
    }
  }

  clearEventReferences() {
    this.mapping.clear();
  }
}

class ElementMapping {}

class Simulation {
  constructor() {
    this.running = [];
    this.pending = [];
    this.lastEvent = undefined;
    this.disabled = []; // List of currently disabled elements
    this.eventDictionary = new EventDictionary();
  }

  getNarrativesForEvent(eventType) {
    return this.eventDictionary.getNarrativesForEvent(eventType);
  }

  async addNarrative(name, prio, fun) {
    var bound = fun.bind({
      lastEvent: () => this.lastEvent,
    });
    var nar = await bound(); // Activate the async generator
    var bid = {
      name: name,
      priority: prio,
      narrative: nar,
      stepIndex: 0, // Initialize step index
    };
    this.running.push(bid);
    // Add event references to the dictionary
    /*const eventTypes = this.extractEventTypesFromNarrative([...nar]);
        eventTypes.forEach((eventType) =>
          this.eventDictionary.addEventReference(eventType, name)
        );*/
  }

  addAll(narratives, priorities) {
    for (var name in narratives) {
      var fun = narratives[name];
      var prio = priorities[name];
      this.addNarrative(name, prio, fun);
    }
  }

  async request(e) {
    var name = "request " + e;
    var nar = async function* () {
      yield {
        request: [e],
        wait: [
          function (x) {
            return true;
          },
        ],
      };
    };
    // XXX should be lowest priority (1 is highest)
    await this.addNarrative(name, 1, nar);
    await this.run(); // Initiate super-step
  }

  async run(onUpdate) {
    if (isEmpty(this.running)) {
      return; // TODO: Test end-case of empty current list
    }
    while (notEmpty(this.running)) {
      var bid = this.running.shift();
      var nar = bid.narrative;
      var next = await nar.next(this.lastEvent);
      if (!next.done) {
        var newbid = next.value; // Run an iteration of the async generator
        newbid.narrative = nar; // Bind the narrative to the bid for running later
        newbid.priority = bid.priority; // Keep copying the prio
        newbid.name = bid.name; // Keep copying the name
        newbid.stepIndex = bid.stepIndex++; // Update the current step of the narrative
        this.pending.push(newbid);
      } else {
        // This is normal - the narrative has finished.
      }
    }
    // End of current part
    this.selectNextEvent();
    if (this.lastEvent) {
      // There is an actual last event selected
      var temp = [];
      while (notEmpty(this.pending)) {
        bid = this.pending.shift();
        var r = bid.request ? bid.request : [];
        // Always convert `request: 'FOO'` into `request: ['FOO']`
        if (!Array.isArray(r)) {
          r = [r];
        }
        var w = bid.wait ? bid.wait : [];
        if (!Array.isArray(w)) {
          w = [w];
        }
        var waitlist = r.concat(w);
        var cur = false;
        for (var i = 0; i < waitlist.length; i++) {
          var waiting = waitlist[i];
          // Convert string `request|wait: 'FOO'` into `request|wait: { type: 'FOO'}`
          if (typeof waiting === "string") {
            waiting = { type: waiting };
          }
          if (
            waiting.type === this.lastEvent.type ||
            (typeof waiting === "function" && waiting(this.lastEvent))
          ) {
            cur = true;
          }
        }
        if (cur && bid.narrative) {
          //bid.stepIndex++; // Increment the step index /////////////////////////////////////////////////////////////////////////////
          this.running.push(bid);
        } else {
          temp.push(bid);
        }
      }
      this.pending = temp;
      await this.run(onUpdate); // Pass the onUpdate callback to the next call
    } else {
      // Nothing was selected - end of super-step
      this.lastEvent = undefined; // Gotcha: null is not the same as undefined

      if (typeof onUpdate === "function") {
        onUpdate(this); // Invoke the onUpdate callback after the simulation runs a step
      }
    }
  }

  selectNextEvent() {
    var i, j, k;
    var candidates = [];
    var events = [];
    for (i = 0; i < this.pending.length; i++) {
      var bid = this.pending[i];
      if (bid.request) {
        // Always convert `request: 'FOO'` into `request: ['FOO']`
        if (!Array.isArray(bid.request)) {
          bid.request = [bid.request];
        }
        for (j = 0; j < bid.request.length; j++) {
          var e = bid.request[j];
          // Convert string `request: 'FOO'` into `request: { type: 'FOO'}`
          if (typeof e === "string") {
            e = { type: e };
          }
          var c = {
            priority: bid.priority,
            event: e,
          };
          candidates.push(c);
        }
      }
    }
    for (i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];
      var ok = true;
      for (j = 0; j < this.pending.length; j++) {
        bid = this.pending[j];
        if (bid.block) {
          // Always convert `block: 'FOO'` into `block: ['FOO']`
          if (!Array.isArray(bid.block)) {
            bid.block = [bid.block];
          }
          for (k = 0; k < bid.block.length; k++) {
            var blocked = bid.block[k];
            e = candidate.event;

            // Convert string `block: 'FOO'` into `block: { type: 'FOO'}`
            if (typeof blocked === "string") {
              blocked = { type: blocked };
            }

            if (
              e.type === blocked.type ||
              (typeof blocked === "function" && blocked(e))
            ) {
              ok = false;
            }
          }
        }
      }
      if (ok) {
        events.push(candidate);
      }
    }
    if (events.length > 0) {
      events.sort(compareBids);
      this.lastEvent = events[0].event;
      this.lastEvent.priority = events[0].priority;
    } else {
      this.lastEvent = null;
    }
  }
  modifyPriority(name, newPriority) {
    const foundBid =
      this.running.find((bid) => bid.name === name) ||
      this.pending.find((bid) => bid.name === name);
    if (foundBid) {
      foundBid.priority = newPriority;
    }
  }

  disableNarrative(name) {
    const index = this.running.findIndex((bid) => bid.name === name);
    if (index !== -1) {
      const bid = this.running[index];
      this.disabled.push(bid);
      this.running.splice(index, 1);
    }
  }

  enableNarrative(name) {
    const index = this.disabled.findIndex((bid) => bid.name === name);
    if (index !== -1) {
      const bid = this.disabled[index];
      this.running.push(bid);
      this.disabled.splice(index, 1);
    }
  }

  removeNarrative(name) {
    const removeFromList = (list) => {
      const index = list.findIndex((bid) => bid.name === name);
      if (index !== -1) {
        list.splice(index, 1);
        return true;
      }
      return false;
    };

    if (!removeFromList(this.running)) {
      if (!removeFromList(this.pending)) {
        removeFromList(this.disabled);
      }
    }
  }

  // Uncomment this method if needed
  // extractEventTypesFromNarrative(narrative) {
  /*const eventTypes = new Set();
  
      // Iterate through the narrative parts
      for (const part of narrative) {
        // Extract event-types from the 'request', 'wait', and 'block' properties
        ["request", "wait", "block"].forEach((property) => {
          if (part[property]) {
            const events = Array.isArray(part[property])
              ? part[property]
              : [part[property]];
            events.forEach((event) => {
              if (typeof event === "string") {
                eventTypes.add(event);
              } else if (event && event.type) {
                eventTypes.add(event.type);
              }
            });
          }
        });
      }
    
      return Array.from(eventTypes); } */
}

export default Simulation;
