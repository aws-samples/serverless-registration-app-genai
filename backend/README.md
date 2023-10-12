# re:Invent 2023 Builders Session SVS 209

## Bedrock

Documentation: https://d2eo22ngex1n9g.cloudfront.net/Documentation/examples.html

## Titan Parameters

Temperature - In short, the lower the temperature, the more deterministic the results in the sense that the highest probable next token is always picked. Increasing temperature could lead to more randomness, which encourages more diverse or creative outputs. You are essentially increasing the weights of the other possible tokens. In terms of application, you might want to use a lower temperature value for tasks like fact-based QA to encourage more factual and concise responses. For poem generation or other creative tasks, it might be beneficial to increase the temperature value.

Top_p - Similarly, with top_p, a sampling technique with temperature called nucleus sampling, you can control how deterministic the model is at generating a response. If you are looking for exact and factual answers keep this low. If you are looking for more diverse responses, increase to a higher value.

Top-p sampling (or nucleus sampling) chooses from the smallest possible set of words whose cumulative probability exceeds the probability p. This way, the number of words in the set can dynamically increase and decrease according to the next word probability distribution.

Stop Sequences are used to make the model stop at a desired point, such as the end of a sentence or a list.

MAX TOKENS is a parameter that limits the number of tokens that can be generated in a single request.

In Top-K sampling, the K most likely next words are filtered and then the next predicted word will be sampled among these K words only.

Count penalty: Reducing probability of generating new tokens that appeared in the prompt or in the completion

Frequency penalty penalizes repeat tokens based on whether have already appeared in the output.

Presence penalty ensures that words present in the prompt do not occur.

Prompt strength: This controls how strongly Stable Diffusion weights your prompt when it’s generating images.

Generation steps: This controls how many diffusion steps the model takes. More is generally better, though you do get diminishing returns.

Seed: This controls the random seed used as the base of the image. It's a number between 1 and 4,294,967,295. If you use the same seed with the same settings, you’ll get similar results each time.

