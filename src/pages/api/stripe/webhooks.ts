import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from 'stream';
import Stripe from "stripe";
import { stripe } from "../../../services/stripe";

async function buffer(readable: Readable) {
    const chunck = [];

    for await (const chunck of readable) {
        chunck.push(
            typeof chunck === "string" ? Buffer.from(chunck) : chunck
        );
    }

    return Buffer.concat(chunck);
}

export const config = {
    api: {
        bodyParser: false,
    }
}

const relevantEvents = new Set([
    'checkout.session.completed'
]);

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
        const buf = await buffer(req);
        const secret = req.headers['stripe-signature'];

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(buf, secret, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            return res.status(400).send(`Webhook error: ${err.message}`);
        }

        const { type } = event;

        if (relevantEvents.has(type)) {
            try {
                switch (type) {
                    case 'checkout.session.completed':
                        // Salvar na base de dados o pagamento concluído
                        break;
                    default:
                        throw new Error('Unhandled event.');
                }
            } catch (err) {
                return res.status(500).json({error: 'Webhook handler failed.'});
            }
        }

        res.status(200).json({received: true})
    } else {
        res.setHeader('Allow', 'POST');
        res.status(405).end("Method not allowed");
    }
}
