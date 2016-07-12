module.exports = function(M,it) {
  M.option({
    test:{
      CallExpression:{
        match:{
          name:{run:true}
        },
        select:'matchCallName',
        cases:{true:{
          sub:'run'
        }}
      },
      compile:true
    },
    run: {
      bind:'true',
      sub:'full'
    },
    full: {
      CallExpression:{
        match:{
          name:{check:true,expect:true,equal:true}
        }
      }
    }
  });
  M.profile('test');
  describe('js control without effects', function() {
    it('should keep order of actions', function(def) {
      def.run(function() {
        def.rec('a');
        def.rec('b');
        def.rec('c');
        def.check('a','b','c');
      });
      def.done();
    });
    context('with `for-in` statement', function() {
      it('should work for empty objects', function(def) {
        def.run(function() {
          var obj = {};
          for(var i in obj) {
            def.rec('i'+i+obj[i]);
          }
          def.check();
        });
        def.done();
      });
      it('should have the same semantics as js', function(def) {
        def.run(function() {
          var obj = {a:1,b:2,c:3};
          for(var i in obj) {
            def.rec('i'+i+obj[i]);
          }
          def.state.sort();
          def.check('ia1','ib2','ic3');
        });
        def.done();
      });
    });
    context('with `for-of` statement', function() {
      context('with arrays', function() {
        it('should work for empty objects', function(def) {
          def.run(function() {
            var arr = [];
            for(var i of arr) {
              def.rec('i'+i+arr[i]);
            }
            def.check();
          });
          def.done();
        });
        it('should have the same semantics as js', function(def) {
          def.run(function() {
            var arr = [1,2,3];
            for(var i of arr) {
              def.rec('i'+i);
            }
            def.state.sort();
            def.check('i1','i2','i3');
          });
          def.done();
        });
      });
      context('without variables capture', function() {
        M.option({varCapt:false});
        it('should work for empty objects', function(def) {
          def.run(function() {
            var arr = [];
            for(var i of arr) {
              def.rec('i'+i+arr[i]);
            }
            def.check();
          });
          def.done();
        });
        it('should have the same semantics as js', function(def) {
          def.run(function() {
            var arr = [1,2,3];
            for(var i of arr) {
              def.rec('i'+i);
            }
            def.state.sort();
            def.check('i1','i2','i3');
          });
          def.done();
        });
      });
      context('with maps', function() {
        it('should work for empty objects', function(def) {
          def.run(function() {
            var map = new Map();
            for(var i of map) {
              def.rec('i'+i[0]+i[1]);
            }
            def.check();
          });
          def.done();
        });
        it('should have the same semantics as js', function(def) {
          def.run(function() {
            var map = new Map();
            map.set('a',1);
            map.set('b',2);
            map.set('c',3);
            for(var i of map) {
              def.rec('i'+i[0]+i[1]);
            }
            def.check('ia1','ib2','ic3');
          });
          def.done();
        });
      });
    });
    context('with `for` statement', function() {
      it('should have the same semantics as js', function(def) {
        def.run(function() {
          def.rec('b');
          for(var i = 0; i < 3; i++) {
            def.rec(i);
          }
          def.rec('a');
          def.check('b',0,1,2,'a');
        });
        def.done();
      });
      it('should pass changed variables after the loop', function(def) {
        def.run(function() {
          var k; 
          def.rec('b');
          for(var i = 0, j = 0; i < 3; i++, j+=10) {
            k = i + j
            def.rec('i:' + i + ':' + j + ':' + k);
          }
          def.rec('a:' + i + ':' + j + ':' + k);
          def.check('b','i:0:0:0','i:1:10:11','i:2:20:22','a:3:30:22');
        });
        def.run(function() {
          def.rec('b');
          for(var i = 0; i < 3; i++) {
            def.rec('i:' + i);
          }
          def.rec('a:' + i);
          def.check('b','i:0','i:1','i:2','a:3');
        });
        def.done();
      });
      it('should be ok to use large counters', function(def) {
        var cnt = def.maxCnt;
        if (!cnt)
          cnt = def.heavy ? 10000 : 1000000;
        def.run(function() {
          def.rec('b');
          for(var i = 0; i < cnt; i++) {
            def.rec(i);
          }
          def.rec('a');
          expect(def.state.length).to.equal(cnt+2);
          def.state.length = 0;
        });
        def.done();
      });
      context('with embedded `for` statements', function() {
        it('should have the same semantics as js', function(def) {
          def.run(function() {
            def.rec('bi');
            for(var i = 0; i < 3; i++) {
              def.rec('bj:'+i+':'+j);
              for(var j = 0; j < 30; j+=10) {
                def.rec('j:'+ i + ':' + j);
              }
              def.rec('aj:'+i+':'+j);
            }
            def.rec('ai');
            def.check('bi',
                  'bj:0:undefined',
                  'j:0:0',
                  'j:0:10',
                  'j:0:20',
                  'aj:0:30',
                  'bj:1:30',
                  'j:1:0',
                  'j:1:10',
                  'j:1:20',
                  'aj:1:30',
                  'bj:2:30',
                  'j:2:0',
                  'j:2:10',
                  'j:2:20',
                  'aj:2:30',
                  'ai');
          });
          def.done();
        }); 
        context('with js control', function() {
          it('should have the same semantics as js', function(def) {
            def.run(function() {
              def.rec('bi');
              for(var i = 0; i < 3; i++) {
                def.rec('bj:'+i);
                for(var j = 0; j < 40; j+=10) {
                  if (j === 10)
                    continue;
                  if (j === 30)
                    break;
                  def.rec(i + j);
                }
                def.rec('aj:'+i);
              }
              def.rec('ai');
              def.check('bi','bj:0',0,20,'aj:0','bj:1',1,21,
                    'aj:1','bj:2',2,22,'aj:2','ai');
            });
            def.done();
          });
          context('with labels', function() {
            it('should have the same semantics as js', function(def) {
              def.run(function() {
                def.rec('bi');
                lab: for(var i = 0; i < 3; i++) {
                  def.rec('bj:'+i);
                  for(var j = 0; j < 40; j+=10) {
                    if (j === 10)
                      continue lab;
                    if (j === 30)
                      break lab;
                    def.rec(i + j);
                  }
                  def.rec('aj:'+i);
                }
                def.rec('ai');
                def.check('bi', 'bj:0', 0, 'bj:1', 1, 'bj:2', 2, 'ai');
              });
              def.done();
            });
          });
        });
      });
      context('embedded into labeled block', function() {
        it('should have the same semantics as js', function(def) {
          def.run(function() {
            def.rec('bi');
            lab: {
              def.rec('bj');
              for(var j = 0; j < 40; j+=10) {
                if (j === 10)
                  continue;
                if (j === 30)
                  break lab;
                def.rec(j);
              }
              def.rec('aj');
            }
            def.rec('ai');
            def.check('bi', 'bj', 0, 20, 'ai');
          });
          def.done();
        });
      });
    });
    context('with exceptions', function() {
      it('should have the same semantics as js', function(def) {
        try {
          def.run(function() {
            try {
              def.rec('bi');
              try {
                def.rec('t');
              } catch (e) {
                def.rec('e:'+e.message);
              } finally {
                def.rec('f');
              }
              def.rec('af');
            } finally {
              def.check('bi','t','f','af');
            }
          });
        } finally {
          def.done();
        }
      });
      context('throws and catches exception', function() {
        it('should have the same semantics as js', function(def) {
          def.run(function() {
            def.rec('bi');
            try {
              def.rec('t');
              throw new Error('e');
            } catch (e) {
              def.rec('e:'+e.message);
            } finally {
              def.rec('f');
            }
            def.rec('af');
            def.check('bi','t','e:e','f','af');
          });
          def.done();
        });
      });
      context('with labeled blocks', function() {
        it('should have the same semantics as js', function(def) {
          def.run(function() {
            def.rec('bi');
            lab: for(var i = 0; i < 3; i++) {
              def.rec('bj:'+i+":"+j);
              try {
                for(var j = 0; j < 40; j+=10) {
                  def.rec('j:'+i+":"+j);
                  try {
                    if (j === 10)
                      continue lab;
                    if (j === 30)
                      throw new Error('z{'+i+':'+j+'}');
                    def.rec(i + j);
                  } catch(e) {
                    def.rec('c1:'+e.message+i+j);
                    break lab;
                  } finally {
                    def.rec('f1:'+i+':'+j);
                  }
                }
              } finally {
                def.rec('f2:'+i+':'+j);
              }
              def.rec('aj:'+i+':'+j);
            }
            def.rec('ai' + i + ':' + j);
            def.check('bi','bj:0:undefined','j:0:0',0,'f1:0:0','j:0:10','f1:0:10','f2:0:10','bj:1:10','j:1:0',
                  1,'f1:1:0','j:1:10','f1:1:10','f2:1:10','bj:2:10','j:2:0',2,'f1:2:0','j:2:10','f1:2:10',
                  'f2:2:10','ai3:10');
          });
          def.run(function() {
            def.rec('bi:' + i + ':' + j);
            lab: for(var i = 0; i < 3; i++) {
              try {
                def.rec('bj:'+i);
                for(var j = 0; j < 40; j+=10) {
                  try {
                    if (j === 10)
                      continue lab;
                    if (j === 30)
                      throw new Error('z');
                    def.rec(i + j);
                  } catch(e) {
                    def.rec('c1:' + e.message + ':' + i + ':' + j);
                    break lab;
                    def.rec('c1:' + e.message);
                  } finally {
                    def.rec('f1:' + i + ':' + j);
                  }
                }
                def.rec('aj:'+i+':'+j);
              } catch(e) {
                def.rec('cj:' + e.message + ':' + i + ':' + j);
              } finally {
                def.rec('fj:' + i + ':' + j);
              }
            }
            def.rec('ai' + i + ':' + j);
            def.check('bi:undefined:undefined','bj:0',0,'f1:0:0','f1:0:10','fj:0:10',
                  'bj:1',1,'f1:1:0','f1:1:10','fj:1:10','bj:2',2,'f1:2:0','f1:2:10',
                      'fj:2:10','ai3:10');
          });
          def.done();
        });
      });
      it('should call finally block', function(def) {
        def.run(function() {
          lab: {
            try {
              def.rec('a1');
              break lab;
              def.rec('a2');
            } finally {
              def.rec('f');
            }
            def.rec('a3');
          }
          def.rec('a4');
          def.check('a1','f','a4');
        });
        def.done();
      });
      context('with break in finally', function() {
        it('shold cancel previous break', function(def) {
          def.run(function() {
            def.rec('a');
            l1: {
              def.rec('l1');
              l2: {
                try {
                  def.rec('l2');
                  break l1;
                } finally {
                  def.rec('f1');
                  break l2;
                }
              }
              def.rec('al2');
            }
            def.rec('al1');
            def.check('a', 'l1', 'l2', 'f1', 'al2', 'al1');
          });
          def.done();
        });
        it('shold cancel previous throw', function(def) {
          def.run(function() {
            def.rec('a');
            l1: {
              def.rec('l1');
              try {
                def.rec('error');
                throw new Error("e");
              } finally {
                def.rec('fin');
                break l1;
              }
              def.rec('at');
            }
            def.rec('al1');
            def.check('a', 'l1', 'error', 'fin', 'al1');
          });
          def.done();
        });
      });
      context('with variables modifications', function() {
        it('should have the same semantics as js', function(def) {
          def.run(function() {
            var i = 8;
            def.rec('bi:' + i + ':' + j);
            i-=8;
            lab: for(i = (def.rec("ii:" + i++), 0);
                     (def.rec("ic:" + ++i), i < 5);
                     def.rec("iu:" + (i+=2))) {
              try {

                def.rec('bj:'+i);
                for(var j = 0; j < 40; j+=10) {
                  try {
                    i-=1;
                  if (j === 10)
                    continue lab;
                    if (j === 30)
                      throw new Error('z');
                    def.rec(i + j);
                  } catch(e) {
                    def.rec('c1:' + e.message);
                    break lab;
                    def.rec('c1:' + e.message);
                  } finally {
                    def.rec('f1');
                  }
                }
                def.rec('aj:'+i+':'+j);
              } catch(e) {
                def.rec('cj' + e.message);
              } finally {
                def.rec('fj');
              }
            }
            i-=3;
            def.rec('ai' + i + ':' + j);
            def.check('bi:8:undefined','ii:0','ic:1','bj:1',0,'f1','f1','fj','iu:1','ic:2',
                  'bj:2',1,'f1','f1','fj','iu:2','ic:3','bj:3',2,'f1','f1','fj','iu:3',
                      'ic:4','bj:4',3,'f1','f1','fj','iu:4','ic:5','ai2:10');
          });
          def.done();
        });
      });
    });
  });
};

module.exports.defaultItArgs = function(D) {
  var state = [];
  return {
    run: function(f) { return f(); },
    done: function() {},
    check: function() {
      expect(state).to.eql(Array.from(arguments));
      state.length = 0;
    },
    rec: function(v) {
      state.push(v);
    },
    state: state
  };
};
