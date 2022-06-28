import * as readline from 'readline';

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let fs = require("fs");

let textByLine = fs.readFileSync("./Transactions2014.csv").toString().split("\r\n");

console.log(textByLine);

const res = textByLine.map((line:string) => line.split(","));
console.log(res)


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

let records = [];

for(let i = 1; i < res.length; i++) {
    let date = res[i][0];
    let to = res[i][1];
    let from = res[i][2];
    let narrative = res[i][3];
    let sum = parseFloat(res[i][4]);
    let record = new Record(date,to,from,narrative,sum);
    records.push(record);
}

let people: Person[] = [];

for(let i = 1; i < records.length; i++) {
    let searchFrom = 0;
    let negativeAmount = records[i].sum * (-1);
    for(let j = 0; j < people.length; j++) {
        if(records[i].from == people[j].name) {
            people[j].transaction(negativeAmount);
            people[j].addTransaction(records[i]);
            searchFrom = 1;
            break;
        }
    }
    if(searchFrom == 0){
        let newPerson = new Person(records[i].from,negativeAmount);
        people.push(newPerson)
    }
    let searchTo = 0;
    for(let j = 0; j < people.length; j++) {
        if(records[i].to == people[j].name) {
            people[j].transaction(records[i].sum);
            people[j].addTransaction(records[i]);
            searchTo = 1;
            break;
        }
    }
    if(searchTo == 0){
        let newPerson = new Person(records[i].from,negativeAmount);
        people.push(newPerson)
    }
}

rl.question('Give a command ', (answer) => {
    if(answer == "List All"){
        for(let i = 0; i < people.length; i++){
           process.stdout.write(people[i].name)
           process.stdout.write(" ")
           process.stdout.write(people[i].money.toString());
           console.log();
        }
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
    }
    rl.close();
});


