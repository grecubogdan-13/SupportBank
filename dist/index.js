"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const readline = __importStar(require("readline"));
let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
let fs = require("fs");
let textByLine = fs.readFileSync("./Transactions2014.csv").toString().split("\r\n");
console.log(textByLine);
const res = textByLine.map((line) => line.split(","));
console.log(res);
class Record {
    constructor(date, from, to, narrative, sum) {
        this.date = "";
        this.from = "";
        this.to = "";
        this.narrative = "";
        this.sum = 0;
        this.date = date;
        this.from = from;
        this.to = to;
        this.narrative = narrative;
        this.sum = sum;
    }
}
class Person {
    constructor(name, money) {
        this.money = 0;
        this.name = "";
        this.transactions = [];
        this.name = name;
        this.money = money;
    }
    transaction(sum) {
        this.money = this.money + sum;
    }
    addTransaction(transaction) {
        this.transactions.push(transaction);
    }
}
let records = [];
for (let i = 1; i < res.length; i++) {
    let date = res[i][0];
    let to = res[i][1];
    let from = res[i][2];
    let narrative = res[i][3];
    let sum = parseFloat(res[i][4]);
    let record = new Record(date, to, from, narrative, sum);
    records.push(record);
}
let people = [];
for (let i = 1; i < records.length; i++) {
    let searchFrom = 0;
    let negativeAmount = records[i].sum * (-1);
    for (let j = 0; j < people.length; j++) {
        if (records[i].from == people[j].name) {
            people[j].transaction(negativeAmount);
            people[j].addTransaction(records[i]);
            searchFrom = 1;
            break;
        }
    }
    if (searchFrom == 0) {
        let newPerson = new Person(records[i].from, negativeAmount);
        people.push(newPerson);
    }
    let searchTo = 0;
    for (let j = 0; j < people.length; j++) {
        if (records[i].to == people[j].name) {
            people[j].transaction(records[i].sum);
            people[j].addTransaction(records[i]);
            searchTo = 1;
            break;
        }
    }
    if (searchTo == 0) {
        let newPerson = new Person(records[i].from, negativeAmount);
        people.push(newPerson);
    }
}
rl.question('Give a command ', (answer) => {
    if (answer == "List All") {
        for (let i = 0; i < people.length; i++) {
            process.stdout.write(people[i].name);
            process.stdout.write(" ");
            process.stdout.write(people[i].money.toString());
            console.log();
        }
    }
    else {
        let text = answer.split(" ");
        if (text[0] == "List") {
            let name = answer.substring(5);
            console.log(name);
            for (let j = 0; j < people.length; j++) {
                if (people[j].name == name) {
                    process.stdout.write(people[j].name);
                    process.stdout.write(" ");
                    process.stdout.write(people[j].money.toString());
                    console.log();
                    console.log(people[j].transactions);
                    break;
                }
            }
        }
    }
    rl.close();
});
//# sourceMappingURL=index.js.map