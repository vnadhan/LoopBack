var app = require('../../server/server');
var Transaction = require('loopback-connector').Transaction;
var db = null;

module.exports = function (Moddel1) {
    // custom function to add model along with model collaterals and model obligors
    // to test transaction management
    Moddel1.remoteMethod(
        'addModdel1', {
            accepts: [{
                arg: 'newModel1',
                type: 'Object',
                http: {
                    source: 'body'
                }
            }],
            returns: {
                type: 'Object',
                root: true
            },
            description: 'Add a Moddel1 ( Txn Mgt Test )',
            http: {
                path: '/addModdel1',
                verb: 'post'
            }
        }
    );

    /**/
    Moddel1.addModdel1 = function (newModel1, cb) {
        db = app.dataSources.cfedb;
        var modelCollModel = app.models.Moddel1collateral;

        // Txn Mgt
        console.log("starting txn");
        var currentTx = null;
        Transaction.begin(db.connector, Transaction.READ_COMMITTED, function (err, tx) {
            // Now we have a transaction (tx)
            currentTx = tx;
            var id;
            var options = {
                transaction: currentTx
            };

            // remove sub entities
            var yy = newModel1.yy;
            delete newModel1.yy;

            var xx = newModel1.xx;
            delete newModel1.xx;

            var zz = newModel1.zz;
            delete newModel1.zz;

            // Add model
            Moddel1.create(newModel1, options,
                function (err, result) {
                    if (err) {
                        console.log("failure in add Moddel1")
                        cb(err);
                    } else {
                        newModel1 = result;
                        console.log("Moddel1 created with id : %s", newModel1.id);
                        id = newModel1.id;

                        // Add model collaterals
                        for (var c in xx)
                            xx[c].id = id;

                        /*console.log("All Collateralls : %s", JSON.stringify(xx));*/
                        console.log("creating xx");
                        modelCollModel.create(xx, options,
                            function (err1, result1) {
                                if (err1) {
                                    console.log("failure in add LC, doing rollback")
                                    currentTx.rollback();
                                    cb(err1);
                                } else {
                                    console.log("committing..");
                                    currentTx.commit();
                                    console.log("submodel1 created with id %s", result1[0].id);
                                    /*newModel1.xx = [];
                                    newModel1.xx = result1;*/
                                    /*console.log(JSON.stringify(newModel1));*/
                                    Moddel1.findById(id, {
                                            include: [
                                                {
                                                    relation: 'zz',
                                                },
                                                {
                                                    relation: 'yy'
                                                },
                                                {
                                                    relation: 'xx'
                                                }
                                            ]
                                        },
                                        function (err, data) {
                                            if (err) {
                                                cb(err);
                                            } else {
                                                cb(null, data)
                                            }
                                        });
                                }
                            });
                    }
                });
        });
    }
};