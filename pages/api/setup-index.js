import { Meilisearch } from "meilisearch";

const client = new Meilisearch({
    host: 'https://ms-f7385f37fa20-3740.sfo.meilisearch.io',
    apiKey: '90cfa7394bf3c968b8d66f6868817717c6f6f33a'
})

export default async function handler(req, res){
    if(req.method == "POST"){
        return res.staus(405).json({message: "only POST requests allowed"})
    }

    try{
        const index = client?.index("hokkienWords")

        await index.updateSearchableAttributes(["meaning", "hokkien"])

        await index.updateSortableAttributes([
            "hokkien", 
            "meaning", 
            "secondMeaning", 
            "thirdMeaning"])

        await index.updateFilterableAttributes([
            "meaning",
            "hokkien"
        ])

        await index.updateRankingRules([
            "meaning",
            "secondMeaning",
            "thirdMeaning",
            "fourthMeaning",
            "fifthMeaning",
            "sixthMeaning",
            "seventhMeaning",
            "eighthMeaning"
        ]);

        return res.status(200).json({ message: "Meilisearch index configured successfully" })

    } catch(error){
        return res.status(500).json({ error: error?.message })
    }
}