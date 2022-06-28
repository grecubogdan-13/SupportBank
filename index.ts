import * as readline from 'readline';
import fs from "fs";
import {Debugger} from "inspector";
var log4js = require("log4js");
var logger = log4js.getLogger("Transactions");

log4js.configure({
    appenders: {
        file: { type: 'fileSync', filename: 'logs/debug.log' }
    },
    categories: {
        default: { appenders: ['file'], level: 'debug'}
    }
});

let rl = require('readline-sync');

class Record {
    date: string = "";
    from: string = "";
    to: string = "";
    narrative: string = "";
    sum: number = 0;

    constructor(date:string, from:string, to:string, narrative:string, sum:number) {
        this.date=date;
        this.from=from;
        this.to=to;
        this.narrative=narrative;
        this.sum=sum;
    }

}

class Person {
    money: number = 0;
    name: string = "";
    transactions: Record[] = [];

    constructor(name: string,money: number) {
        this.name = name;
        this.money = money;
    }

    transaction(sum: number) {
        this.money = this.money + sum;
    }

    addTransaction(transaction: Record){
        this.transactions.push(transaction);
    }
}

function readFile(filename: string){
    let fs = require("fs");
    if(fs.existsSync(filename)) {
        let textByLine = fs.readFileSync(filename).toString().split("\r\n");
        console.log(textByLine);
        const res = textByLine.map((line: string) => line.split(","));
        console.log(res)
        return res;
    }
    else {
        logger.log("Error","File doesnt exist");
    }
}

function parseDataArray(data_array: string[][]){
    let records = [];
    for(let i = 1; i < data_array.length; i++) {
        let date = data_array[i][0];
        let to = data_array[i][1];
        let from = data_array[i][2];
        let narrative = data_array[i][3];
        if(isNaN(parseFloat(data_array[i][4]))){
            logger.log("Error","Invalid Amount, check line " + i);
        }
        let sum = parseFloat(data_array[i][4]);
        let record = new Record(date,to,from,narrative,sum);
        records.push(record);
    }
    return records;
}

function evalTransactions(transactions: Record[]){
    let people: Person[] = [];

    for(let i = 1; i < transactions.length; i++) {
        let searchFrom = 0;
        let negativeAmount = transactions[i].sum * (-1);
        for(let j = 0; j < people.length; j++) {
            if(transactions[i].from == people[j].name) {
                people[j].transaction(negativeAmount);
                people[j].addTransaction(transactions[i]);
                searchFrom = 1;
                break;
            }
        }
        if(searchFrom == 0){
            let newPerson = new Person(transactions[i].from,negativeAmount);
            people.push(newPerson)
        }
        let searchTo = 0;
        for(let j = 0; j < people.length; j++) {
            if(transactions[i].to == people[j].name) {
                people[j].transaction(transactions[i].sum);
                people[j].addTransaction(transactions[i]);
                searchTo = 1;
                break;
            }
        }
        if(searchTo == 0){
            let newPerson = new Person(transactions[i].from,negativeAmount);
            people.push(newPerson)
        }
    }
    return people;
}

let running = 1;
let people: Person[] = [];

while(running){
    let answer = rl.question('Give a command ');
    if(answer == "List All"){
        for(let i = 0; i < people.length; i++){
            process.stdout.write(people[i].name)
            process.stdout.write(" ")
            process.stdout.write(people[i].money.toString());
            console.log();
        }
    }
    else if(answer == "Exit"){
        running = 0;
    }
    else {
        let text = answer.split(" ");
        if(text[0] == "List"){
            let name = answer.substring(5);
            console.log(name);
            for(let j = 0; j < people.length; j++) {
                if (people[j].name == name) {
                    process.stdout.write(people[j].name)
                    process.stdout.write(" ")
                    process.stdout.write(people[j].money.toString());
                    console.log();
                    console.log(people[j].transactions);
                    break;
                }
            }
        }
        else if(text[0] == "Add") {
            let name = answer.substring(4);
            let data_array = readFile(name);
            let transactions = parseDataArray(data_array);
            people = evalTransactions(transactions);
        }
    }
    logger.log("debug","proba") ;
}









//let data_array = readFile("./DodgyTransactions2015.csv");
//let transactions = parseDataArray(data_array);
//let people = evalTransactions(transactions);