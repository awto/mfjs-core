module.exports = function (M, it) {
    describe('js control without effects', function () {
        it('should keep order of actions', function (def) {
            return M(def.run(function () {
                return M(def.rec('a')).mbind(function () {
                    return def.rec('b');
                }).mbind(function () {
                    return def.rec('c');
                }).mapply(function () {
                    def.check('a', 'b', 'c');
                });
            })).mapply(function () {
                def.done();
            });
        });
        context('with `for-in` statement', function () {
            it('should work for empty objects', function (def) {
                return M(def.run(function () {
                    var obj;
                    var i;
                    var iter;
                    obj = {};
                    iter = M.forInIterator(obj);
                    return M.forPar(function (iter) {
                        return iter;
                    }, function (iter) {
                        i = iter.value;
                        return def.rec('i' + i + obj[i]);
                    }, function (iter) {
                        iter = iter();
                        return iter;
                    }, iter).mapply(function () {
                        def.check();
                    });
                })).mapply(function () {
                    def.done();
                });
            });
            it('should have the same semantics as js', function (def) {
                return M(def.run(function () {
                    var obj;
                    var i;
                    var iter;
                    obj = {
                        a: 1,
                        b: 2,
                        c: 3
                    };
                    iter = M.forInIterator(obj);
                    return M.forPar(function (iter) {
                        return iter;
                    }, function (iter) {
                        i = iter.value;
                        return def.rec('i' + i + obj[i]);
                    }, function (iter) {
                        iter = iter();
                        return iter;
                    }, iter).mbind(function () {
                        return def.state.sort();
                    }).mapply(function () {
                        def.check('ia1', 'ib2', 'ic3');
                    });
                })).mapply(function () {
                    def.done();
                });
            });
        });
        context('with `for-of` statement', function () {
            context('with arrays', function () {
                it('should work for empty objects', function (def) {
                    return M(def.run(function () {
                        var arr;
                        var i;
                        var iter;
                        arr = [];
                        iter = M.iteratorBuf(arr);
                        return M.forPar(function (iter) {
                            return iter;
                        }, function (iter) {
                            i = iter.value;
                            return def.rec('i' + i + arr[i]);
                        }, function (iter) {
                            iter = iter();
                            return iter;
                        }, iter).mapply(function () {
                            def.check();
                        });
                    })).mapply(function () {
                        def.done();
                    });
                });
                it('should have the same semantics as js', function (def) {
                    return M(def.run(function () {
                        var arr;
                        var i;
                        var iter;
                        arr = [
                            1,
                            2,
                            3
                        ];
                        iter = M.iteratorBuf(arr);
                        return M.forPar(function (iter) {
                            return iter;
                        }, function (iter) {
                            i = iter.value;
                            return def.rec('i' + i);
                        }, function (iter) {
                            iter = iter();
                            return iter;
                        }, iter).mbind(function () {
                            return def.state.sort();
                        }).mapply(function () {
                            def.check('i1', 'i2', 'i3');
                        });
                    })).mapply(function () {
                        def.done();
                    });
                });
            });
            context('without variables capture', function () {
                it('should work for empty objects', function (def) {
                    return M(def.run(function () {
                        var arr;
                        var i;
                        var iter;
                        arr = [];
                        iter = M.iterator(arr);
                        return M.forPar(function () {
                            return iter;
                        }, function () {
                            i = iter.value;
                            return def.rec('i' + i + arr[i]);
                        }, function () {
                            iter = iter();
                        }).mapply(function () {
                            def.check();
                        });
                    })).mapply(function () {
                        def.done();
                    });
                });
                it('should have the same semantics as js', function (def) {
                    return M(def.run(function () {
                        var arr;
                        var i;
                        var iter;
                        arr = [
                            1,
                            2,
                            3
                        ];
                        iter = M.iterator(arr);
                        return M.forPar(function () {
                            return iter;
                        }, function () {
                            i = iter.value;
                            return def.rec('i' + i);
                        }, function () {
                            iter = iter();
                        }).mbind(function () {
                            return def.state.sort();
                        }).mapply(function () {
                            def.check('i1', 'i2', 'i3');
                        });
                    })).mapply(function () {
                        def.done();
                    });
                });
            });
            context('with maps', function () {
                it('should work for empty objects', function (def) {
                    return M(def.run(function () {
                        var map;
                        var i;
                        var iter;
                        map = new Map();
                        iter = M.iteratorBuf(map);
                        return M.forPar(function (iter) {
                            return iter;
                        }, function (iter) {
                            i = iter.value;
                            return def.rec('i' + i[0] + i[1]);
                        }, function (iter) {
                            iter = iter();
                            return iter;
                        }, iter).mapply(function () {
                            def.check();
                        });
                    })).mapply(function () {
                        def.done();
                    });
                });
                it('should have the same semantics as js', function (def) {
                    return M(def.run(function () {
                        var map;
                        var i;
                        var iter;
                        map = new Map();
                        return M(map.set('a', 1)).mbind(function () {
                            return map.set('b', 2);
                        }).mbind(function () {
                            return map.set('c', 3);
                        }).mbind(function () {
                            iter = M.iteratorBuf(map);
                            return M.forPar(function (iter) {
                                return iter;
                            }, function (iter) {
                                i = iter.value;
                                return def.rec('i' + i[0] + i[1]);
                            }, function (iter) {
                                iter = iter();
                                return iter;
                            }, iter);
                        }).mapply(function () {
                            def.check('ia1', 'ib2', 'ic3');
                        });
                    })).mapply(function () {
                        def.done();
                    });
                });
            });
        });
        context('with `for` statement', function () {
            it('should have the same semantics as js', function (def) {
                return M(def.run(function () {
                    var i;
                    return M(def.rec('b')).mbind(function () {
                        i = 0;
                        return M.forPar(function (i) {
                            return i < 3;
                        }, function (i) {
                            return def.rec(i);
                        }, function (i) {
                            i++;
                            return i;
                        }, i);
                    }).mbind(function () {
                        return def.rec('a');
                    }).mapply(function () {
                        def.check('b', 0, 1, 2, 'a');
                    });
                })).mapply(function () {
                    def.done();
                });
            });
            it('should pass changed variables after the loop', function (def) {
                return M(def.run(function () {
                    var k;
                    var i, j;
                    return M(def.rec('b')).mbind(function () {
                        i = 0;
                        j = 0;
                        return M.forPar(M.spread(function (i, j) {
                            return i < 3;
                        }), M.spread(function (i, j) {
                            k = i + j;
                            return def.rec('i:' + i + ':' + j + ':' + k);
                        }), M.spread(function (i, j) {
                            i++, j += 10;
                            return [
                                i,
                                j
                            ];
                        }), [
                            i,
                            j
                        ]);
                    }).mbind(M.spread(function (i, j) {
                        return def.rec('a:' + i + ':' + j + ':' + k);
                    })).mapply(function () {
                        def.check('b', 'i:0:0:0', 'i:1:10:11', 'i:2:20:22', 'a:3:30:22');
                    });
                })).mbind(function () {
                    return def.run(function () {
                        var i;
                        return M(def.rec('b')).mbind(function () {
                            i = 0;
                            return M.forPar(function (i) {
                                return i < 3;
                            }, function (i) {
                                return def.rec('i:' + i);
                            }, function (i) {
                                i++;
                                return i;
                            }, i);
                        }).mbind(function (i) {
                            return def.rec('a:' + i);
                        }).mapply(function () {
                            def.check('b', 'i:0', 'i:1', 'i:2', 'a:3');
                        });
                    });
                }).mapply(function () {
                    def.done();
                });
            });
            it('should be ok to use large counters', function (def) {
                var cnt;
                cnt = def.maxCnt;
                if (!cnt)
                    cnt = def.heavy ? 10000 : 1000000;
                return M(def.run(function () {
                    var i;
                    return M(def.rec('b')).mbind(function () {
                        i = 0;
                        return M.forPar(function (i) {
                            return i < cnt;
                        }, function (i) {
                            return def.rec(i);
                        }, function (i) {
                            i++;
                            return i;
                        }, i);
                    }).mbind(function () {
                        return def.rec('a');
                    }).mapply(function () {
                        expect(def.state.length).to.equal(cnt + 2);
                        def.state.length = 0;
                    });
                })).mapply(function () {
                    def.done();
                });
            });
            context('with embedded `for` statements', function () {
                it('should have the same semantics as js', function (def) {
                    return M(def.run(function () {
                        var i;
                        var j;
                        return M(def.rec('bi')).mbind(function () {
                            i = 0;
                            return M.block(function (brk) {
                                return M.repeat(M.spread(function (i, j) {
                                    return function () {
                                        if (i < 3)
                                            return M(def.rec('bj:' + i + ':' + j)).mbind(function () {
                                                return function (j) {
                                                    j = 0;
                                                    return M.forPar(function (j) {
                                                        return j < 30;
                                                    }, function (j) {
                                                        return def.rec('j:' + i + ':' + j);
                                                    }, function (j) {
                                                        j += 10;
                                                        return j;
                                                    }, j);
                                                }(j);
                                            }).mbind(function (j) {
                                                return M(def.rec('aj:' + i + ':' + j)).mconst(j);
                                            });
                                        else
                                            return brk();
                                    }().mapply(function (j) {
                                        return function (i) {
                                            i++;
                                            return [
                                                i,
                                                j
                                            ];
                                        }(i);
                                    });
                                }), [
                                    i,
                                    j
                                ]);
                            });
                        }).mbind(function () {
                            return def.rec('ai');
                        }).mapply(function () {
                            def.check('bi', 'bj:0:undefined', 'j:0:0', 'j:0:10', 'j:0:20', 'aj:0:30', 'bj:1:30', 'j:1:0', 'j:1:10', 'j:1:20', 'aj:1:30', 'bj:2:30', 'j:2:0', 'j:2:10', 'j:2:20', 'aj:2:30', 'ai');
                        });
                    })).mapply(function () {
                        def.done();
                    });
                });
                context('with js control', function () {
                    it('should have the same semantics as js', function (def) {
                        return M(def.run(function () {
                            var i;
                            var j;
                            return M(def.rec('bi')).mbind(function () {
                                i = 0;
                                return M.block(function (brk) {
                                    return M.repeat(M.spread(function (i, j) {
                                        return function () {
                                            if (i < 3)
                                                return M(def.rec('bj:' + i)).mbind(function () {
                                                    j = 0;
                                                    return M.block(function (brk1) {
                                                        return M.repeat(function (j) {
                                                            return M.block(function (cont1) {
                                                                if (j < 40)
                                                                    return M(function () {
                                                                        if (j === 10)
                                                                            return cont1();
                                                                    }()).mbind(function () {
                                                                        if (j === 30)
                                                                            return brk1(j);
                                                                    }).mbind(function () {
                                                                        return def.rec(i + j);
                                                                    });
                                                                else
                                                                    return brk1(j);
                                                            }).mapply(function () {
                                                                return function (j) {
                                                                    j += 10;
                                                                    return j;
                                                                }(j);
                                                            });
                                                        }, j);
                                                    });
                                                }).mbind(function (j) {
                                                    return M(def.rec('aj:' + i)).mconst(j);
                                                });
                                            else
                                                return brk();
                                        }().mapply(function (j) {
                                            return function (i) {
                                                i++;
                                                return [
                                                    i,
                                                    j
                                                ];
                                            }(i);
                                        });
                                    }), [
                                        i,
                                        j
                                    ]);
                                });
                            }).mbind(function () {
                                return def.rec('ai');
                            }).mapply(function () {
                                def.check('bi', 'bj:0', 0, 20, 'aj:0', 'bj:1', 1, 21, 'aj:1', 'bj:2', 2, 22, 'aj:2', 'ai');
                            });
                        })).mapply(function () {
                            def.done();
                        });
                    });
                    context('with labels', function () {
                        it('should have the same semantics as js', function (def) {
                            return M(def.run(function () {
                                var i;
                                var j;
                                return M(def.rec('bi')).mbind(function () {
                                    i = 0;
                                    return M.block(function (labBrk) {
                                        return M.repeat(M.spread(function (i, j) {
                                            return M.block(function (labCont) {
                                                if (i < 3)
                                                    return M(def.rec('bj:' + i)).mbind(function () {
                                                        j = 0;
                                                        return M.block(function (brk) {
                                                            return M.repeat(function (j) {
                                                                return function () {
                                                                    if (j < 40)
                                                                        return M(function () {
                                                                            if (j === 10)
                                                                                return labCont(j);
                                                                        }()).mbind(function () {
                                                                            if (j === 30)
                                                                                return labBrk();
                                                                        }).mbind(function () {
                                                                            return def.rec(i + j);
                                                                        });
                                                                    else
                                                                        return brk(j);
                                                                }().mapply(function () {
                                                                    return function (j) {
                                                                        j += 10;
                                                                        return j;
                                                                    }(j);
                                                                });
                                                            }, j);
                                                        });
                                                    }).mbind(function (j) {
                                                        return M(def.rec('aj:' + i)).mconst(j);
                                                    });
                                                else
                                                    return labBrk();
                                            }).mapply(function (j) {
                                                return function (i) {
                                                    i++;
                                                    return [
                                                        i,
                                                        j
                                                    ];
                                                }(i);
                                            });
                                        }), [
                                            i,
                                            j
                                        ]);
                                    });
                                }).mbind(function () {
                                    return def.rec('ai');
                                }).mapply(function () {
                                    def.check('bi', 'bj:0', 0, 'bj:1', 1, 'bj:2', 2, 'ai');
                                });
                            })).mapply(function () {
                                def.done();
                            });
                        });
                    });
                });
            });
            context('embedded into labeled block', function () {
                it('should have the same semantics as js', function (def) {
                    return M(def.run(function () {
                        var j;
                        return M(def.rec('bi')).mbind(function () {
                            return M.block(function (lab) {
                                return M(def.rec('bj')).mbind(function () {
                                    j = 0;
                                    return M.block(function (brk) {
                                        return M.repeat(function (j) {
                                            return M.block(function (cont) {
                                                if (j < 40)
                                                    return M(function () {
                                                        if (j === 10)
                                                            return cont();
                                                    }()).mbind(function () {
                                                        if (j === 30)
                                                            return lab();
                                                    }).mbind(function () {
                                                        return def.rec(j);
                                                    });
                                                else
                                                    return brk();
                                            }).mapply(function () {
                                                return function (j) {
                                                    j += 10;
                                                    return j;
                                                }(j);
                                            });
                                        }, j);
                                    });
                                }).mbind(function () {
                                    return def.rec('aj');
                                });
                            });
                        }).mbind(function () {
                            return def.rec('ai');
                        }).mapply(function () {
                            def.check('bi', 'bj', 0, 20, 'ai');
                        });
                    })).mapply(function () {
                        def.done();
                    });
                });
            });
        });
        context('with exceptions', function () {
            it('should have the same semantics as js', function (def) {
                return M.coerce(function () {
                    return def.run(function () {
                        return M.coerce(function () {
                            return M(def.rec('bi')).mbind(function () {
                                return M.coerce(function () {
                                    return def.rec('t');
                                }).mhandle(function (e) {
                                    return def.rec('e:' + e.message);
                                }).mfinally(function () {
                                    return def.rec('f');
                                });
                            }).mbind(function () {
                                return def.rec('af');
                            });
                        }).mfinally(function () {
                            def.check('bi', 't', 'f', 'af');
                        });
                    });
                }).mfinally(function () {
                    def.done();
                });
            });
            context('throws and catches exception', function () {
                it('should have the same semantics as js', function (def) {
                    return M(def.run(function () {
                        return M(def.rec('bi')).mbind(function () {
                            return M.coerce(function () {
                                return M(def.rec('t')).mbind(function () {
                                    return M.raise(new Error('e'));
                                });
                            }).mhandle(function (e) {
                                return def.rec('e:' + e.message);
                            }).mfinally(function () {
                                return def.rec('f');
                            });
                        }).mbind(function () {
                            return def.rec('af');
                        }).mapply(function () {
                            def.check('bi', 't', 'e:e', 'f', 'af');
                        });
                    })).mapply(function () {
                        def.done();
                    });
                });
            });
            context('with labeled blocks', function () {
                it('should have the same semantics as js', function (def) {
                    return M(def.run(function () {
                        var i;
                        var j;
                        return M(def.rec('bi')).mbind(function () {
                            i = 0;
                            return M.block(function (labBrk) {
                                return M.repeat(function (i) {
                                    return M.block(function (labCont) {
                                        if (i < 3)
                                            return M(def.rec('bj:' + i + ':' + j)).mbind(function () {
                                                return M.coerce(function () {
                                                    j = 0;
                                                    return M.block(function (brk) {
                                                        return M.repeat(function () {
                                                            return function () {
                                                                if (j < 40)
                                                                    return M(def.rec('j:' + i + ':' + j)).mbind(function () {
                                                                        return M.coerce(function () {
                                                                            return M(function () {
                                                                                if (j === 10)
                                                                                    return labCont();
                                                                            }()).mbind(function () {
                                                                                if (j === 30)
                                                                                    return M.raise(new Error('z{' + i + ':' + j + '}'));
                                                                            }).mbind(function () {
                                                                                return def.rec(i + j);
                                                                            });
                                                                        }).mhandle(function (e) {
                                                                            return M(def.rec('c1:' + e.message + i + j)).mbind(function () {
                                                                                return labBrk(i);
                                                                            });
                                                                        }).mfinally(function () {
                                                                            return def.rec('f1:' + i + ':' + j);
                                                                        });
                                                                    });
                                                                else
                                                                    return brk();
                                                            }().mapply(function () {
                                                                j += 10;
                                                            });
                                                        });
                                                    });
                                                }).mfinally(function () {
                                                    return def.rec('f2:' + i + ':' + j);
                                                });
                                            }).mbind(function () {
                                                return def.rec('aj:' + i + ':' + j);
                                            });
                                        else
                                            return labBrk(i);
                                    }).mapply(function () {
                                        return function (i) {
                                            i++;
                                            return i;
                                        }(i);
                                    });
                                }, i);
                            });
                        }).mbind(function (i) {
                            return def.rec('ai' + i + ':' + j);
                        }).mapply(function () {
                            def.check('bi', 'bj:0:undefined', 'j:0:0', 0, 'f1:0:0', 'j:0:10', 'f1:0:10', 'f2:0:10', 'bj:1:10', 'j:1:0', 1, 'f1:1:0', 'j:1:10', 'f1:1:10', 'f2:1:10', 'bj:2:10', 'j:2:0', 2, 'f1:2:0', 'j:2:10', 'f1:2:10', 'f2:2:10', 'ai3:10');
                        });
                    })).mbind(function () {
                        return def.run(function () {
                            var i;
                            var j;
                            return M(def.rec('bi:' + i + ':' + j)).mbind(function () {
                                return function (i) {
                                    i = 0;
                                    return M.block(function (labBrk) {
                                        return M.repeat(function (i) {
                                            return M.block(function (labCont) {
                                                if (i < 3)
                                                    return M.coerce(function () {
                                                        return M(def.rec('bj:' + i)).mbind(function () {
                                                            j = 0;
                                                            return M.block(function (brk) {
                                                                return M.repeat(function () {
                                                                    return function () {
                                                                        if (j < 40)
                                                                            return M.coerce(function () {
                                                                                return M(function () {
                                                                                    if (j === 10)
                                                                                        return labCont();
                                                                                }()).mbind(function () {
                                                                                    if (j === 30)
                                                                                        return M.raise(new Error('z'));
                                                                                }).mbind(function () {
                                                                                    return def.rec(i + j);
                                                                                });
                                                                            }).mhandle(function (e) {
                                                                                return M(def.rec('c1:' + e.message + ':' + i + ':' + j)).mbind(function () {
                                                                                    return labBrk(i);
                                                                                }).mbind(function () {
                                                                                    return def.rec('c1:' + e.message);
                                                                                });
                                                                            }).mfinally(function () {
                                                                                return def.rec('f1:' + i + ':' + j);
                                                                            });
                                                                        else
                                                                            return brk();
                                                                    }().mapply(function () {
                                                                        j += 10;
                                                                    });
                                                                });
                                                            });
                                                        }).mbind(function () {
                                                            return def.rec('aj:' + i + ':' + j);
                                                        });
                                                    }).mhandle(function (e) {
                                                        return def.rec('cj:' + e.message + ':' + i + ':' + j);
                                                    }).mfinally(function () {
                                                        return def.rec('fj:' + i + ':' + j);
                                                    });
                                                else
                                                    return labBrk(i);
                                            }).mapply(function () {
                                                return function (i) {
                                                    i++;
                                                    return i;
                                                }(i);
                                            });
                                        }, i);
                                    });
                                }(i);
                            }).mbind(function (i) {
                                return def.rec('ai' + i + ':' + j);
                            }).mapply(function () {
                                def.check('bi:undefined:undefined', 'bj:0', 0, 'f1:0:0', 'f1:0:10', 'fj:0:10', 'bj:1', 1, 'f1:1:0', 'f1:1:10', 'fj:1:10', 'bj:2', 2, 'f1:2:0', 'f1:2:10', 'fj:2:10', 'ai3:10');
                            });
                        });
                    }).mapply(function () {
                        def.done();
                    });
                });
            });
            it('should call finally block', function (def) {
                return M(def.run(function () {
                    return M.block(function (lab) {
                        return M.coerce(function () {
                            return M(def.rec('a1')).mbind(lab);
                        }).mfinally(function () {
                            return def.rec('f');
                        }).mbind(function () {
                            return def.rec('a3');
                        });
                    }).mbind(function () {
                        return def.rec('a4');
                    }).mapply(function () {
                        def.check('a1', 'f', 'a4');
                    });
                })).mapply(function () {
                    def.done();
                });
            });
            context('with variables modifications', function () {
                it('should have the same semantics as js', function (def) {
                    return M(def.run(function () {
                        var i;
                        var j;
                        i = 8;
                        return M(def.rec('bi:' + i + ':' + j)).mbind(function () {
                            return function (i) {
                                i -= 8;
                                return M(def.rec('ii:' + i++)).mbind(function (b) {
                                    return function (i) {
                                        i = (b, 0);
                                        return M.block(function (labBrk) {
                                            return M.repeat(M.spread(function (i, j) {
                                                return M.block(function (labCont) {
                                                    return M(def.rec('ic:' + ++i)).mbind(function (b1) {
                                                        if (b1, i < 5)
                                                            return M.coerce(function () {
                                                                return M(def.rec('bj:' + i)).mbind(function () {
                                                                    return function (i) {
                                                                        j = 0;
                                                                        return M.block(function (brk) {
                                                                            return M.repeat(M.spread(function (i, j) {
                                                                                return function () {
                                                                                    if (j < 40)
                                                                                        return M.coerce(function () {
                                                                                            i -= 1;
                                                                                            return M(function () {
                                                                                                if (j === 10)
                                                                                                    return labCont([
                                                                                                        i,
                                                                                                        j
                                                                                                    ]);
                                                                                            }()).mbind(function () {
                                                                                                if (j === 30)
                                                                                                    return M.raise(new Error('z'));
                                                                                            }).mbind(function () {
                                                                                                return M(def.rec(i + j)).mconst(i);
                                                                                            });
                                                                                        }).mhandle(function (e) {
                                                                                            return M(def.rec('c1:' + e.message)).mbind(function () {
                                                                                                return labBrk([
                                                                                                    i,
                                                                                                    j
                                                                                                ]);
                                                                                            }).mbind(function () {
                                                                                                return def.rec('c1:' + e.message);
                                                                                            });
                                                                                        }).mfinally(function () {
                                                                                            return def.rec('f1');
                                                                                        }).mconst(i);
                                                                                    else
                                                                                        return brk([
                                                                                            i,
                                                                                            j
                                                                                        ]);
                                                                                }().mapply(function (i) {
                                                                                    return function (j) {
                                                                                        j += 10;
                                                                                        return [
                                                                                            i,
                                                                                            j
                                                                                        ];
                                                                                    }(j);
                                                                                });
                                                                            }), [
                                                                                i,
                                                                                j
                                                                            ]);
                                                                        });
                                                                    }(i);
                                                                }).mbind(M.spread(function (i, j) {
                                                                    return M(def.rec('aj:' + i + ':' + j)).mconst([
                                                                        i,
                                                                        j
                                                                    ]);
                                                                }));
                                                            }).mhandle(function (e) {
                                                                return def.rec('cj' + e.message);
                                                            }).mfinally(function () {
                                                                return def.rec('fj');
                                                            }).mconst([
                                                                i,
                                                                j
                                                            ]);
                                                        else
                                                            return labBrk([
                                                                i,
                                                                j
                                                            ]);
                                                    });
                                                }).mbind(M.spread(function (i, j) {
                                                    return M(def.rec('iu:' + (i += 2))).mconst([
                                                        i,
                                                        j
                                                    ]);
                                                }));
                                            }), [
                                                i,
                                                j
                                            ]);
                                        });
                                    }(i);
                                });
                            }(i);
                        }).mbind(M.spread(function (i, j) {
                            i -= 3;
                            return def.rec('ai' + i + ':' + j);
                        })).mapply(function () {
                            def.check('bi:8:undefined', 'ii:0', 'ic:1', 'bj:1', 0, 'f1', 'f1', 'fj', 'iu:1', 'ic:2', 'bj:2', 1, 'f1', 'f1', 'fj', 'iu:2', 'ic:3', 'bj:3', 2, 'f1', 'f1', 'fj', 'iu:3', 'ic:4', 'bj:4', 3, 'f1', 'f1', 'fj', 'iu:4', 'ic:5', 'ai2:10');
                        });
                    })).mapply(function () {
                        def.done();
                    });
                });
            });
        });
    });
};
module.exports.defaultItArgs = function (D) {
    var state = [];
    return {
        run: function (f) {
            return f();
        },
        done: function () {
        },
        check: function () {
            expect(state).to.eql(Array.from(arguments));
            state.length = 0;
        },
        rec: function (v) {
            state.push(v);
        },
        state: state
    };
};