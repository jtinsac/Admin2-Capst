import { Chart as ChartJS, defaults } from "chart.js/auto"
import SidebarAd2 from "../components/sidebarAd2"
import { Bar, Doughnut } from "react-chartjs-2"
import sourceData from "../sourceData.json"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Mail,
  Phone,
  Goal,
  ListOrdered,
  IdCard,
  ChartLine,
  Search,
  User,
  CalendarDays,
  CircleCheck, 
  CircleX, 
} from "lucide-react";
import React, { useEffect, useState } from "react";
import tableData from "../tableData.json"
import { database } from '../firebase.config';
import { ref, get, child, set, query, orderByChild, equalTo, update, onValue } from "firebase/database";
import '../components/dashboard2.css'




//code sa bargraph
function BarChart({ database }) {
  const [sourceData, setSourceData] = useState([]);

  useEffect(() => {
    // Reference to the MonthlyQueueRecord table
    const dbRef = ref(database, "MonthlyQueueRecord");
    // Listen for real-time updates from the database
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const currentYear = new Date().getFullYear();
      const formattedData = months.map((month) => {
        const key = `${month}-${currentYear}`;
        const monthData = snapshot.val()?.[key];
        return {
          label: month,
          value: monthData ? monthData.TotalQueueRecord : "---",
        };
      });
      setSourceData(formattedData);
    });


    return () => unsubscribe();
  }, [database]);
  return (
    <div className="bar-card student-dept">
      <Bar
        data={{
          labels: sourceData.map((data) => data.label),
          datasets: [
            {
              label: "Number of Visitors",
              data: sourceData.map((data) =>
                data.value === "---" ? 0 : data.value
              ),
            },
          ],
        }}
        options={{
          plugins: {
            title: {
              display: true,
              text: "Queue Records per Month",
            },
            tooltip: {
              callbacks: {
                label: (context) =>
                  sourceData[context.dataIndex].value === "---"
                    ? "No data available"
                    : `Number of Students: ${context.raw}`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 20,
              },
            },
          },
        }}
      />
    </div>
  );
}


defaults.maintainAspectRatio = false;
defaults.responsive = true;

defaults.plugins.title.display = true;
defaults.plugins.title.align = "start";
defaults.plugins.title.font.size = 20;
defaults.plugins.title.font.weight = 100;
defaults.plugins.title.color = "#1C2E8B";

function DoughnutChart({ database }) {
  const [sourceData, setSourceData] = useState([]);

  useEffect(() => {
    // Reference to the CompletedQueues table
    const dbRef = ref(database, "CompletedQueues");
    // Listen for real-time updates from the database
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const specificPurposes = ["Examination", "Enrollment", "Balance"];
      const currentYear = new Date().getFullYear();

      // Initialize counts for purposes
      const purposeCounts = {
        Examination: 0,
        Enrollment: 0,
        Balance: 0,
        Others: 0, // Count for all other purposes
      };

      // Iterate through database entries
      const rawData = snapshot.val();
      if (rawData) {
        Object.keys(rawData).forEach((key) => {
          const record = rawData[key];
          const queuePurposeString = record.Queue_Purpose;

          // Split the Queue_Purpose by commas
          const purposes = queuePurposeString.split(", ").map((item) => item.trim());

          purposes.forEach((purpose) => {
            if (specificPurposes.includes(purpose)) {
              purposeCounts[purpose] += 1;
            } else {
              purposeCounts.Others += 1;
            }
          });
        });
      }

      // Format data for the Doughnut chart
      const formattedData = Object.entries(purposeCounts).map(([key, value]) => ({
        label: key,
        value,
      }));

      setSourceData(formattedData);
    });

    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, [database]);

  return (
    <div className="donut-card student-rec">
      <Doughnut
        data={{
          labels: sourceData.map((data) => data.label),
          datasets: [
            {
              label: "Number of Visitors",
              data: sourceData.map((data) => data.value),
              backgroundColor: [
                "#FF6384", // Red
                "#36A2EB", // Blue
                "#FFCE56", // Yellow
                "#4BC0C0", // Teal
                "#9966FF", // Purple
              ],
              borderColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
              ],
            },
          ],
        }}
        options={{
          plugins: {
            title: {
              display: true,
              text: "Queue Purpose Record",
            },
            tooltip: {
              callbacks: {
                label: (context) =>
                  `Number of Students: ${context.raw}`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 20,
              },
            },
          },
        }}
      />
    </div>
  );
}


function Dashboard2(){

  const [data, setData] = React.useState([]);
  const [sorting, setSorting] = React.useState([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [visitorCount, setVisitorCount] = React.useState("--");
  const [monthlyVisitorCount, setMonthlyVisitorCount] = React.useState("--");
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-PH'));
    const [userName, setUserName] = React.useState("");

    React.useEffect(() => {
    const fetchUserName = async () => {
      try {
        // Assume the logged-in username is stored in localStorage
        const loggedInUsername = localStorage.getItem("loggedInUsername"); // Example: "admin1"
        if (loggedInUsername) {
          const userRef = ref(database, `admin/${loggedInUsername}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUserName(userData.Name || "User");
          } else {
            console.error("User data not found");
          }
        } else {
          console.error("No logged-in username found");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserName();
  }, []);

  

  //code sa pagdisplay ng date
  const dbdate = new Date().toLocaleDateString('en-PH', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  //Clock displayeye
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-PH'));
    }, 1000);

    // Cleanup the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);


  //code sa pagdisplay ng daily at monthly visitors
  useEffect(() => {
    const fetchData = () => {
      try {

        const dailyRef = ref(database, "daily_queue_number_counter");
        const dailyUnsubscribe = onValue(dailyRef, (snapshot) => {
          if (snapshot.exists()) {
            setVisitorCount(snapshot.val());
          } else {
            console.error("No daily data available");
          }
        });
  

        const monthlyRef = ref(database, "monthly_queue_number_counter");
        const monthlyUnsubscribe = onValue(monthlyRef, (snapshot) => {
          if (snapshot.exists()) {
            setMonthlyVisitorCount(snapshot.val());
          } else {
            console.error("No monthly data available");
          }
        });
  
  
        return () => {
          dailyUnsubscribe();
          monthlyUnsubscribe();
        };
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchData();
  }, []);

  const columnHelper = createColumnHelper();

const columns = [
  columnHelper.accessor("QueueID", {
    cell: (info) => info.getValue(),
    header: () => (
      <span className="flex items-center">
        <ListOrdered className="mr-2" size={18} /> Date & Time
      </span>
    ),
  }),
  columnHelper.accessor("UserID", {
    cell: (info) => info.getValue(),
    header: () => (
      <span className="flex items-center">
        <IdCard className="mr-2" size={18} /> UserID
      </span>
    ),
  }),
  columnHelper.accessor("Name", {
    cell: (info) => info.getValue(),
    header: () => (
      <span className="flex items-center">
        <User className="mr-2" size={16} /> Name
      </span>
    ),
  }),
  columnHelper.accessor("Queue_Purpose", {
    cell: (info) => info.getValue(),
    header: () => (
      <span className="flex items-center"> 
      <Goal className="mr-2" size={16} /> Purpose
      </span>
    ),
  }),
  columnHelper.accessor("Status", {
    header: () => (
      <span className="flex items-center">
        <ChartLine className="mr-2" size={16} /> Status 
         </span>
    ),
    cell: (info) => (
      <span className={`italic text-white p-2 px-3.5 rounded-3xl ${
        info.getValue() === "Completed" ? "bg-green-600" : "bg-red-600"
      }`}>
        {info.getValue()}
      </span>
    ),
  }),
];


  //code sa pagdisplay ng completed queues table
  React.useEffect(() => {
    const dbRef = ref(database, "CompletedQueues");
  
    const unsubscribe = onValue(dbRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const firebaseData = snapshot.val();
          const formattedData = Object.keys(firebaseData).map((id) => {
            const item = firebaseData[id];
            return {
              QueueID: item.Date_and_Time_Completed,
              UserID: item.UserID,
              Name: item.Name,
              Queue_Purpose: item.Queue_Purpose,
              Status: item.Status,
            };
          })  .sort((a, b) => {
            const dateA = new Date(a.QueueID);
            const dateB = new Date(b.QueueID);
            return dateB - dateA;  });

          setData(formattedData);
        } else {
          console.log("No data available");
          setData([]); // Clear the table if walang data
        }
      } catch (error) {
        console.error("Error processing snapshot data: ", error);
      }
    });
  

    return () => unsubscribe();
  }, []);

  //code sa pagination ng mga table
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    initialState: {
      pagination: {
        pageSize: 5,
        pageIndex: 0,
      },
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination, 
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  console.log(table.getRowModel());

// 2nd tebel
  const pendingColumns = [
    columnHelper.accessor("Date", {
      cell: (info) => info.getValue(),
      header: () => (
        <span className="flex items-center">
          <CalendarDays className="mr-2" size={16} /> Date
        </span>
      ),
    }),
    columnHelper.accessor("TotalCompleted", {
      cell: (info) => info.getValue(),
      header: () => (
        <span className="flex items-center">
          <CircleCheck  className="mr-2" size={16} /> Completed
        </span>
      ),
    }),
    columnHelper.accessor("TotalCancelled", {
      cell: (info) => info.getValue(),
      header: () => (
        <span className="flex items-center">
          <CircleX  className="mr-2" size={16} /> Cancelled
        </span>
      ),
    }),
    columnHelper.accessor("Total", {
      cell: (info) => info.getValue(),
      header: () => (
        <span className="flex items-center">
          <Goal className="mr-2" size={16} /> Total
        </span>
      ),
    })
  
  ];

  
  
  // State for the second table
  const [pendingData, setPendingData] = React.useState([]);
  const [pendingSorting, setPendingSorting] = React.useState([]);
  const [pendingGlobalFilter, setPendingGlobalFilter] = React.useState("");
  const [pendingPagination, setPendingPagination] = React.useState({
    pageIndex: 0,
    pageSize: 5,
  });
  
  // Fetch "PendingQueues" data
  React.useEffect(() => {
    const dbRef = ref(database, "DailyQueueRecord");
    const unsubscribe = onValue(dbRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const firebaseData = snapshot.val();
          const formattedData = Object.keys(firebaseData).map((id) => {
            const item = firebaseData[id];
            return {
              Date: id,
              TotalCompleted: item.TotalCompleted,
              TotalCancelled: item.TotalCancelled,
              Total: item.TotalQueues,
            };
          }).sort((a, b) => new Date(b.Date) - new Date(a.Date)); 

          console.log(formattedData);
        
          setPendingData(formattedData);
        } else {
          console.log("No data available");
          setPendingData([]); // Clear the table if there's no data
        }
      } catch (error) {
        console.error("Error processing snapshot data: ", error);
      }
    });
  
    // Cleanup listener when the component unmounts
    return () => unsubscribe();
  }, []);
  
  
  const pendingTable = useReactTable({
    data: pendingData,
    columns: pendingColumns,
    state: {
      sorting: pendingSorting,
      globalFilter: pendingGlobalFilter,
      pagination: pendingPagination,
    },
    initialState: {
      pagination1: {
        pageSize: 5,
        pageIndex: 0,
      },
    },
    onSortingChange: setPendingSorting,
    onGlobalFilterChange: setPendingGlobalFilter,
    onPaginationChange: setPendingPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

    return(
   <>
     <SidebarAd2/>
     <div className="d-container">
      <div className="d-heading">
        <div className="name">
        <h4>Welcome, {userName}! Window 2</h4>
         <h5 className="dash-date">{dbdate}</h5>
         </div>
            <div className="time">{time}</div>
      </div>
       <hr/>
     <div className="d-content">
     <div className="topDiv-header">Analytics</div>
      <div className="topdiv">
     <div className="visit-wrapper">
      <div className="visit-card">
         <h3 className="visit-header">Visitors Today</h3>
         <h1 className="visitor-count">{visitorCount}</h1>

       </div>

       <div className="visit-card">
         <h3 className="visit-header">This Month</h3>
         <h1 className="mos-visitor">{monthlyVisitorCount}</h1>
        
      </div>
      </div>
      <BarChart database={database} />
      </div>
      </div>

      <div className="table-header">Daily Queue</div>
      <div className="flex flex-col lg:flex-row  gap-4">
      <div className="flex-1">
<div className="flex flex-col min-h-full py-3 px-2 sm:px-6 lg:px-8">
  <div className="mb-4 relative">
    <input
      value={globalFilter ?? ""}
      onChange={(e) => setGlobalFilter(e.target.value)}
      placeholder="Search..."
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
    />
    <Search
      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      size={20}
    />
  </div>

  <div className="w-full overflow-x-auto bg-white shadow-md rounded-lg">
    <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
      <thead className="bg-gray-50">
        {pendingTable.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="text-center p-3 px-9 border text-[11px] font-medium text-blue-800 font-[nobile] uppercase tracking-wider"
              >
                <div
                  {...{
                    className: header.column.getCanSort()
                      ? "cursor-pointer select-none flex items-center"
                      : "",
                    onClick: header.column.getToggleSortingHandler(),
                  }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  <ArrowUpDown className="ml-2" size={14} />
                </div>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {pendingTable.getPaginationRowModel().rows.map((row) => (
          <tr key={row.id} className="hover:bg-gray-100 cursor-pointer">
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className="text-center border px-6 py-4 whitespace-nowrap text-sm text-gray-500"
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  {/* items per page */}
  <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-700">
        <div className=" sm:mb-0">
          <span className="mr-2">Items per page</span>
          <select
            className="border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
            value={pendingTable.getState().pagination.pageSize}
            onChange={(e) => {
              pendingTable.setPageSize(Number(e.target.value,5));
            }}
          >
            {[5, 10, 20, 30].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
       {/* next pagination */}
       <div className="flex items-center space-x-2">
  <button
    className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
    onClick={() => pendingTable.setPageIndex(0)}
    disabled={!pendingTable.getCanPreviousPage()}
  >
    <ChevronsLeft size={20} />
  </button>

  <button
    className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
    onClick={() => pendingTable.previousPage()}
    disabled={!pendingTable.getCanPreviousPage()}
  >
    <ChevronLeft size={20} />
  </button>

  <span className="flex items-center">
    <input
      min={1}
      max={pendingTable.getPageCount()}
      type="number"
      value={pendingTable.getState().pagination.pageIndex + 1}
      onChange={(e) => {
        const page = e.target.value ? Number(e.target.value) - 1 : 0;
        pendingTable.setPageIndex(page);
      }}
      className="w-16 p-2 rounded-md border border-gray-300 text-center"
    />
    <span className="ml-1">of {pendingTable.getPageCount()}</span>
  </span>

  <button
    className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
    onClick={() => pendingTable.nextPage()}
    disabled={!pendingTable.getCanNextPage()}
  >
    <ChevronRight size={20} />
  </button>

  <button
    className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
    onClick={() => pendingTable.setPageIndex(pendingTable.getPageCount() - 1)}
    disabled={!pendingTable.getCanNextPage()}
  >
    <ChevronsRight size={20} />
  </button>
</div>
</div>
</div>
</div>

<div className="pr-7">
<DoughnutChart database={database} />
</div>
</div>

      <div className="table-header2"> Transaction History</div>
  
      <div className="flex flex-col min-h-full max-xl:-4xl py-3 px-4 sm:px-6 lg:px-8">
      <div className="mb-4 relative">
        <input
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
      </div>


      
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-center p-3 px-20 border text-xs font-medium text-blue-800 uppercase tracking-wider"
                  >
                    <div
                      {...{
                        className: header.column.getCanSort()
                          ? "cursor-pointer select-none flex items-center"
                          : "",
                        onClick: header.column.getToggleSortingHandler(),
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      <ArrowUpDown className="ml-2" size={14} />
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
          {table.getPaginationRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-100 cursor-pointer">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className=" text-center border px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

       {/* Completed Track Table */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-700">
        <div className="flex items-center mb-4 sm:mb-0">
          <span className="mr-2">Items per page</span>
          <select
            className="border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2"
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value,5));
            }}
          >
            {[10, 15, 20, 30].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft size={20} />
          </button>

          <button
            className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft size={20} />
          </button>

          <span className="flex items-center">
            <input
              min={1}
              max={table.getPageCount()}
              type="number"
              value={table.getState().pagination.pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                table.setPageIndex(page);
              }}
              className="w-16 p-2 rounded-md border border-gray-300 text-center"
            />
            <span className="ml-1">of {table.getPageCount()}</span>
          </span>

          <button
            className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight size={20} />
          </button>

          <button
            className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight size={20} />
          </button>
        </div>
      </div>
    </div>
     

    </div>
    
   </>
    )
}

export default Dashboard2