export default function DisplayDate() {
    const date = new Date()

    return (
        <span className="text-2xl font-semibold text-black">
            {new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date)}
            , {date.getDate()}{' '}
            {date.toLocaleString('default', { month: 'long' })}{' '}
            {date.getFullYear()}
        </span>
    )
}
