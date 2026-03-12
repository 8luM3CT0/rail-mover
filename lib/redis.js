import {Client, Entity, Schema, Repository} from 'redis-om'

const client = new Client()

const username = 'blumecto'
const password = '8luM3CT0!!'
const endpoint = 'redis-10455.c267.us-east-1-4.ec2.cloud.redislabs.com:10455'

async function connect(){
    if(!client.isOpen()){
        await client.open(`redis://${username}:${password}@${endpoint}`)
    }
}

class Word extends Entity {}
let schema = new Schema(
    Word,
    {
        hokkien: {type: 'text', textSearch: true},
        hanzi: {type: 'text', textSearch: true},
        poj: {type: 'text', textSearch: true},
        lannang: {type: 'text', textSearch: true},
        meaningType: {type: 'text', textSearch: true},
        meaning: {type: 'text', textSearch: true}
    },
    {
        dataStructure: 'JSON'
    }
);

export async function createWord(data){
    await connect();

    const repository = client.fetchRepository(schema, client)

    const word = repository.createEntity(data)

    const id = await repository.save(word);
    return id;
}

export async function getWord(id){
    await connect();

    const repository = client.fetchRepository(schema, client)
    return repository.fetch(id);
}

export async function createIndex(){
    await connect();
    const repository = client.fetchRepository(schema, client)
    await repository.createIndex()
}

export async function searchWord(q){
    await connect();

    const repository = client.fetchRepository(schema, client);

    const words = await repository.search()
    .where('hokkien').match(q)
    .or('hanzi').match(q)
    .or('lannang').match(q)
    .or('poj').match(q)
    .or('meaningType').match(q)
    .or('meaning').match(q)
    .return.all();

    return words;
}