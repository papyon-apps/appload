type Props = {
    params: {
        app_slug: string
    }
}

export default function Page({ params }: Props) {
    return <div>My Post: {params.app_slug}</div>
}