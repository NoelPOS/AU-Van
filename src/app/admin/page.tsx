import Link from 'next/link'
import AdminTimeslot from '@/app/ui/admin-timeslot-creation/AdminTimeslot'
import TimeSlot from '../ui/timeslot/timeslotadmin'
import DisplayDate from '../ui/display-date/display-date'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const description =
    'An orders dashboard with a sidebar navigation. The sidebar has icon navigation. The content area has a breadcrumb and search in the header. The main area has a list of recent orders with a filter and export button. The main area also has a detailed view of a single order with order details, shipping information, billing information, customer information, and payment information.'

export default function Dashboard() {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
                    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                            <Card
                                className="sm:col-span-2"
                                x-chunk="dashboard-05-chunk-0"
                            >
                                <CardHeader className="pb-3">
                                    <DisplayDate />
                                    <CardTitle>Welcome back Admin!</CardTitle>
                                    <CardDescription className="max-w-lg text-balance leading-relaxed">
                                        Here's what's happening with your
                                        business today
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline">
                                                New Timeslot
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <AdminTimeslot />
                                        </DialogContent>
                                    </Dialog>
                                </CardFooter>
                            </Card>
                        </div>
                        <Tabs defaultValue="week">
                            <div className="flex items-center">
                                <TabsList>
                                    <TabsTrigger value="week">
                                        Today's Bookings
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                            <TabsContent value="week">
                                <Card x-chunk="dashboard-05-chunk-3">
                                    <CardHeader className="px-7">
                                        <CardTitle>Bookings</CardTitle>
                                        <CardDescription>
                                            Your bookings for today
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        Customer
                                                    </TableHead>
                                                    <TableHead className="hidden sm:table-cell">
                                                        Pick Up Place
                                                    </TableHead>
                                                    <TableHead className="hidden sm:table-cell">
                                                        Number of People
                                                    </TableHead>
                                                    <TableHead className="hidden md:table-cell">
                                                        Time
                                                    </TableHead>
                                                    <TableHead className="hidden md:table-cell">
                                                        Route
                                                    </TableHead>
                                                    <TableHead className="text-right">
                                                        Phone
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <TableRow className="bg-accent">
                                                    <TableCell>
                                                        <div className="font-medium">
                                                            Noel
                                                        </div>
                                                        <div className="hidden text-sm text-muted-foreground md:inline">
                                                            noel@gmail.com
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        Ananda
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        2
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        10:00
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        AU-Mega
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        084252480
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                    <div className="flex flex-col gap-5">
                        {/* <DisplayDate /> */}
                        <TimeSlot
                            from="Siam Paragon"
                            to="Assumption University"
                        />
                        <TimeSlot
                            from="Assumption University"
                            to="Siam Paragon"
                        />
                        <TimeSlot
                            from="Assumption University"
                            to="Mega Bangna"
                        />
                        <TimeSlot
                            from="Mega Bangna"
                            to="Assumption University"
                        />
                    </div>
                </main>
            </div>
        </div>
    )
}
