global.document = {
  createElement() {
    return {};
  },
  documentElement: {
    firstElementChild: {
      appendChild() {},
    },
  },
};
global.navigator = {
  permissions: {
    query() {
      return {};
    },
  },
};

const expect = require('expect.js');
const sketchEditor = require('../dist/index');

describe('Event', function() {
  it('on && emit', function() {
    let event = new sketchEditor.util.Event();
    let count = 0;
    event.on('name', function() {
      count++;
    });
    event.emit('name');
    expect(count).to.eql(1);
  });
  it('on data', function() {
    let event = new sketchEditor.util.Event();
    let count = [];
    event.on('name', function(a, b) {
      count = [a, b];
    });
    event.emit('name', 1, 2);
    expect(count).to.eql([1, 2]);
  });
  it('emit count', function() {
    let event = new sketchEditor.util.Event();
    let count = 0;
    event.on('name', function() {
      count++;
    });
    event.emit('name');
    event.emit('name');
    event.emit('name');
    event.emit('name');
    event.emit('name2');
    event.emit('name3');
    expect(count).to.eql(4);
  });
  it('off', function() {
    let event = new sketchEditor.util.Event();
    let count = 0;
    function cb() {
      count++;
    }
    event.on('name', cb);
    event.off('name', cb);
    event.emit('name');
    expect(count).to.eql(0);
  });
  it('off no ref', function() {
    let event = new sketchEditor.util.Event();
    let count = 0;
    event.on('name', function() {
      count++;
    });
    event.off('name', function() {
      count++;
    });
    event.emit('name');
    expect(count).to.eql(1);
  });
  it('off no param', function() {
    let event = new sketchEditor.util.Event();
    let count = 0;
    event.on('name', function() {
      count++;
    });
    event.off('name');
    event.emit('name');
    expect(count).to.eql(0);
  });
  it('off arguments', function() {
    let event = new sketchEditor.util.Event();
    let count = 0;
    function cb() {
      count++;
      event.off('name', cb);
    }
    event.on('name', cb);
    event.emit('name');
    event.emit('name');
    event.emit('name');
    event.emit('name');
    expect(count).to.eql(1);
  });
  it('callback list is not altered during trigger', function() {
    let event = new sketchEditor.util.Event();
    let count = [0, 0, 0];
    function cb1() {
      count[1]++;
    }
    function cb2() {
      count[2]++;
    }
    event.on('name', function() {
      count[0]++;
      event.off('name');
    });
    event.on('name', cb1);
    event.on('name', cb2);
    event.emit('name');
    expect(count).to.eql([1, 1, 1]);
  });
  it('return self', function() {
    let event = new sketchEditor.util.Event();
    let count = 0;
    event.on('name', function() {
      count++;
    }).emit('name').off('name').emit('name');
    expect(count).to.eql(1);
  });
  it('on array', function() {
    let event = new sketchEditor.util.Event();
    let count = 0;
    event.on(['name', 'name2'], function() {
      count++;
    });
    event.emit('name');
    event.emit('name2');
    expect(count).to.eql(2);
  });
  it('emit array', function() {
    let event = new sketchEditor.util.Event();
    let count = 0;
    event.on('name', function() {
      count++;
    });
    event.on('name2', function() {
      count++;
    });
    event.emit(['name', 'name2']);
    expect(count).to.eql(2);
  });
  it('emit array params', function() {
    let event = new sketchEditor.util.Event();
    let s = '';
    event.on('name', function(p) {
      s += p[0];
    });
    event.on('name2', function(p) {
      s += p[0];
    });
    event.emit(['name', 'name2'], ['a']);
    expect(s).to.eql('aa');
  });
  it('off array', function() {
    let event = new sketchEditor.util.Event();
    let count = 0;
    event.on('name', function() {
      count++;
    });
    event.on('name2', function() {
      count++;
    });
    event.off(['name', 'name2']);
    event.emit(['name', 'name2']);
    expect(count).to.eql(0);
  });
  it('once', function() {
    let event = new sketchEditor.util.Event();
    let count = 0;
    event.once('name', function() {
      count++;
    });
    event.emit('name');
    event.emit('name');
    event.emit('name');
    expect(count).to.eql(1);
  });
  it('once array but emit only 1', function() {
    let event = new sketchEditor.util.Event();
    let count = 0;
    event.once(['name', 'name2'], function() {
      count++;
    });
    event.emit('name');
    event.emit('name');
    event.emit('name');
    expect(count).to.eql(1);
  });
  it('once array', function() {
    let event = new sketchEditor.util.Event();
    let count = 0;
    event.once(['name', 'name2'], function() {
      count++;
    });
    event.emit('name');
    event.emit('name2');
    event.emit('name');
    event.emit('name2');
    expect(count).to.eql(2);
  });
});

describe('vector', function() {
  it('includedAngle', function() {
    let vector = sketchEditor.math.vector;
    expect(vector.includedAngle(0, 0, 0, 0)).to.eql(0);
    expect(vector.includedAngle(84, 0, 119, 0)).to.eql(0);
    expect(vector.includedAngle(-84, 0, -119, 0)).to.eql(0);
    expect(vector.includedAngle(-84, 0, 119, 0)).to.eql(Math.PI);
    expect(vector.includedAngle(0, 10, 0, 10)).to.eql(0);
    expect(vector.includedAngle(0, -10, 0, -10)).to.eql(0);
    expect(vector.includedAngle(0, 10, 0, -10)).to.eql(Math.PI);
    expect(vector.includedAngle(0, 10, 10, 0)).to.eql(Math.PI * 0.5);
  });
});
