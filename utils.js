var fs = require('fs');
var path = require('path');
var request = require('request');
var util = require('ethereumjs-util');
var ethKeys = require("ethereumjs-keys");
var Web3 = require('web3');

var config_path = path.join(__dirname, 'net_config.json');
var data_path = path.join(__dirname, 'keystore.json');

function loadConfig(on_data) {
    fs.readFile(config_path,'utf8',function(err,data){
        if (err) {
            console.log(err);
            empty_data = { endpoint: 'http://ip:port'}
            createFile(config_path, JSON.stringify(empty_data))
            on_data(empty_data);

        }else{
            console.log(data);
            on_data(JSON.parse(data))
        }
    });
}

function loadKeyStore(on_data) {
    fs.readFile(data_path,'utf8',function(err,data){
        if (err) {
            console.log(err);
            empty_data = { wallets: []}
            createFile(data_path, JSON.stringify(empty_data))
            on_data(empty_data)

        }else{
            console.log(data);
            on_data(JSON.parse(data))
        }
    });
}


function createFile(path, content) {
    fs.writeFile(path, content, function (err) {
        if (!err) {
            console.log("写入成功！")
        }
    })
}

function updateNet(config) {
    createFile(config_path, JSON.stringify(config))
}

function updateKeyStore(keystore) {
    createFile(data_path, JSON.stringify(keystore))
}

function JsonRpc(url, data, callback) {
    var options = {
        uri: url,
        method: 'POST',
        json: data
    };

    request(options, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            callback(body, null)
        }else{
            console.log(error)
            callback(null, error)
        }
    });

}

function loadParam(url, addr, when_ok) {
    JsonRpc(url, {
        "jsonrpc": "2.0",
        "method": "eth_gasPrice",
        "params": [],
        "id": 73
    }, (resp1, error1)=>{
        if (!error1){
            let gasPrice = resp1.result
            JsonRpc(url,
                {"jsonrpc":"2.0",
                    "method":"eth_getTransactionCount",
                    "params":[ addr, "latest"],
                    "id":1
                }, (resp2, error2) =>{
                if (!error2){
                    let nonce = resp2.result
                    when_ok(gasPrice, nonce, null)
                }else{
                    when_ok(null. null, error2)
                }
            })
        }else{
            when_ok(null, null, error1)
        }
    })
}

function getBalance(url, addr, onResp) {
    JsonRpc(url, {
        "jsonrpc":"2.0",
        "method":"eth_getBalance",
        "params":[addr, "latest"],
        "id":1
    }, (resp, error)=>{
        if (!error){
            onResp(resp.result, null)
        }else{
            onResp(null, error)
        }
    })

}

function create_wallet() {
    let dk = ethKeys.create();
    let privateKey = util.bufferToHex(dk.privateKey)
    let publicKey = util.bufferToHex(util.privateToPublic(privateKey))
    let address = '0x' + util.bufferToHex(util.sha3(publicKey)).slice(26);
    return { address: address, privateKey:privateKey, dt:new Date() }
}

function hex2bignum(url, hex) {
    var web3 = new Web3(new Web3.providers.HttpProvider(url));
    return web3.toBigNumber(hex)
}

function toHex(url, number) {
    var web3 = new Web3(new Web3.providers.HttpProvider(url));
    return web3.toHex(number)
}