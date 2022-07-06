import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useSession } from "next-auth/client";

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import Head from 'next/head';
import styles from './styles.module.scss';
import { RichText } from 'prismic-dom';

type Post = {
    slug: string;
    title: string;
    excerpt: string;
    updatedAt: string;
}

interface PostsProps {
    posts: Post[];
}

export default function Posts({ posts }: PostsProps) {
    const [session] = useSession();

    return (
        <>
            <Head>
                <title>Posts | Ignews</title>
            </Head>

            <main className={styles.container}>
                <div className={styles.posts}>
                    {posts.map((post) => (
                        session?.activeSubscription ?
                            <Link href={`/posts/${post.slug}`} key={post.slug}>
                                <a>
                                    <time>{post.updatedAt}</time>
                                    <strong>{post.title}</strong>
                                    <p>{post.excerpt}</p>
                                </a>
                            </Link>
                            :
                            <Link href={`/posts/preview/${post.slug}`} key={post.slug}>
                                <a>
                                    <time>{post.updatedAt}</time>
                                    <strong>{post.title}</strong>
                                    <p>{post.excerpt}</p>
                                </a>
                            </Link>
                    ))}
                </div>
            </main>
        </>
    );
}

export const getStaticProps: GetStaticProps = async () => {
    const prismic = getPrismicClient();

    const response = await prismic.query(
        Prismic.Predicates.at('document.type', 'po'),
        {
            orderings: '[my.post.date desc]',
            fetch: ['post.title', 'post.content'],
            pageSize: 100,
        }
    );

    // console.log(JSON.stringify(response, null, 2));

    const posts = response.results.map(post => {
        return {
            slug: post.uid,
            title: RichText.asText(post.data.title),
            excerpt: post.data.content.find(content => content.type === 'paragraph')?.text ?? '',
            updatedAt: new Date(post.last_publication_date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            })
        }
    })

    return {
        props: {
            posts
        }
    }
}