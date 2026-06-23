import{r as f,j as e,c as T,N as re,f as E,e as G,L as X}from"./index-BMVbGCcz.js";import{F as se,a as de,b as ne}from"./ChevronRightIcon-G1fQvLUb.js";import{B as ee}from"./Button-CLCjZHnN.js";import{C as Z,b as J,a as te}from"./Card-DC0lmdXX.js";import{B as oe}from"./Badge-BI1fWAES.js";import{F as ie}from"./ArrowLeftIcon-k-5UKiyB.js";function le({selectedDate:c,onDateSelect:m,selectedRange:r,onRangeSelect:h,mode:i="single"}){const[s,d]=f.useState(new Date),[x,C]=f.useState(!1),[b,w]=f.useState(null),D=new Date;D.setHours(0,0,0,0);const j=(t,a)=>new Date(t,a+1,0).getDate(),A=(t,a)=>new Date(t,a,1).getDay(),y=s.getFullYear(),p=s.getMonth(),V=j(y,p),R=A(y,p),M=["January","February","March","April","May","June","July","August","September","October","November","December"],S=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],H=()=>{d(new Date(y,p-1,1))},L=()=>{d(new Date(y,p+1,1))},P=t=>{const a=new Date(y,p,t);return a.setHours(0,0,0,0),a.getTime()===D.getTime()},$=t=>{const a=new Date(y,p,t);if(a.setHours(0,0,0,0),i==="single"&&c)return a.getTime()===c.getTime();if(i==="range"&&(r!=null&&r.start)){if(a.getTime()===r.start.getTime()||r.end&&a.getTime()===r.end.getTime())return!0;if(!r.end&&b){const g=r.start,N=b,n=Math.min(g.getTime(),N.getTime()),l=Math.max(g.getTime(),N.getTime());return a.getTime()>=n&&a.getTime()<=l}}return!1},B=t=>{if(i!=="range"||!(r!=null&&r.start))return!1;const a=new Date(y,p,t);a.setHours(0,0,0,0);const g=r.start;if(!r.end){if(!b)return!1;const n=b,l=Math.min(g.getTime(),n.getTime()),u=Math.max(g.getTime(),n.getTime());return a.getTime()>l&&a.getTime()<u}const N=r.end;return a.getTime()>g.getTime()&&a.getTime()<N.getTime()},F=t=>{const a=new Date(y,p,t);if(a.setHours(0,0,0,0),i==="single")m==null||m(a);else if(i==="range")if(!x)h==null||h({start:a,end:null}),C(!0);else{const g=r==null?void 0:r.start;g&&a.getTime()<g.getTime()?h==null||h({start:a,end:g}):h==null||h({start:g,end:a}),C(!1)}},z=t=>{if(i==="range"&&x){const a=new Date(y,p,t);a.setHours(0,0,0,0),w(a)}},v=[];for(let t=0;t<R;t++)v.push(null);for(let t=1;t<=V;t++)v.push(t);return e.jsxs("div",{className:T(i==="single"?"w-72":"w-full max-w-sm"),children:[e.jsxs("div",{className:"flex items-center justify-between mb-3",children:[e.jsx("button",{type:"button",onClick:H,className:"p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",children:e.jsx(se,{className:"h-5 w-5 text-gray-600 dark:text-gray-300"})}),e.jsxs("span",{className:"text-sm font-semibold text-gray-900 dark:text-white",children:[M[p]," ",y]}),e.jsx("button",{type:"button",onClick:L,className:"p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",children:e.jsx(de,{className:"h-5 w-5 text-gray-600 dark:text-gray-300"})})]}),e.jsxs("div",{className:"grid grid-cols-7 gap-0.5",children:[S.map(t=>e.jsx("div",{className:"text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1",children:t},t)),v.map((t,a)=>t===null?e.jsx("div",{className:"h-8"},`empty-${a}`):e.jsx("button",{type:"button",onClick:()=>F(t),onMouseEnter:()=>z(t),onMouseLeave:()=>w(null),className:T("h-8 w-full text-sm rounded-lg transition-colors",$(t)?"bg-primary-600 text-white":B(t)?"bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300":"hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200",P(t)&&!$(t)&&"font-bold text-primary-600 dark:text-primary-400"),children:t},t))]}),i==="range"&&e.jsx("div",{className:"mt-3 text-xs text-gray-500 dark:text-gray-400",children:x?"Select end date":"Select start date"})]})}const ce=()=>e.jsxs("svg",{viewBox:"0 0 512 512",className:"h-4 w-4",fill:"currentColor",children:[e.jsx("path",{d:"M417.975,226.338c-5.966,0-11.764,0.618-17.404,1.684l-33.048-100.841c-5.781-17.644-22.258-29.577-40.822-29.577h-45.506v24.414h45.506c8.038-0.008,15.147,5.155,17.636,12.768l6.028,18.433h-60.684c-31.084,0-54.424,15.542-54.424,15.542v45.358h135.064l7.064,21.54c-31.579,15.163-53.42,47.345-53.435,84.704c0.016,51.936,42.09,94.018,94.026,94.033c51.92-0.015,94.01-42.097,94.025-94.033C511.985,268.435,469.895,226.353,417.975,226.338z M461.456,363.844c-11.175,11.144-26.462,18.007-43.48,18.007c-17.034,0-32.29-6.862-43.466-18.007c-11.144-11.176-18.008-26.447-18.008-43.481c0-17.026,6.863-32.29,18.008-43.465c3.88-3.88,8.409-7.01,13.185-9.754l11.114,33.928c-4.962,4.931-8.037,11.748-8.037,19.29c0,15.032,12.18,27.22,27.204,27.22c15.024,0,27.204-12.188,27.204-27.22c0-13.633-10.062-24.809-23.14-26.787l-11.128-33.974c2.35-0.278,4.637-0.711,7.064-0.711c17.018,0,32.305,6.855,43.48,18.008c11.144,11.175,17.977,26.439,18.008,43.465C479.432,337.397,472.6,352.668,461.456,363.844z"}),e.jsx("path",{d:"M94.01,226.338C42.074,226.353,0.016,268.435,0,320.363c0.016,51.936,42.074,94.018,94.01,94.033c51.936-0.015,94.01-42.097,94.026-94.033C188.02,268.435,145.946,226.353,94.01,226.338z M137.491,363.844c-11.176,11.144-26.447,18.007-43.481,18.007c-17.034,0-32.29-6.862-43.466-18.007c-11.16-11.176-18.008-26.447-18.008-43.481c0-17.026,6.848-32.29,18.008-43.465C61.72,265.745,76.976,258.89,94.01,258.89c17.034,0,32.306,6.855,43.481,18.008c11.144,11.175,17.992,26.439,18.008,43.465C155.483,337.397,148.636,352.668,137.491,363.844z"}),e.jsx("path",{d:"M94.01,293.167c-15.024,0-27.204,12.172-27.204,27.196c0,15.032,12.18,27.22,27.204,27.22c15.025,0,27.22-12.188,27.22-27.22C121.23,305.339,109.035,293.167,94.01,293.167z"}),e.jsx("path",{d:"M439.074,207.55v-65.855c-27.854,0-45.583,18.997-45.583,18.997v27.854C393.491,188.546,411.22,207.55,439.074,207.55z"}),e.jsx("rect",{x:"450.868",y:"141.68",class:"st0",width:"13.525",height:"65.847"}),e.jsx("path",{d:"M70.5,214.119H220.17v-42.762h-45.52c-12.212,0-24.345-1.932-35.954-5.742l-16.261-5.34c-11.592-3.81-23.742-5.758-35.953-5.758H70.5c-8.47,0-15.348,6.886-15.348,15.372v28.858C55.151,207.233,62.029,214.119,70.5,214.119z"}),e.jsx("path",{d:"M343.302,232.111v-1.352H167.03c26.029,21.161,42.708,53.435,42.708,89.636c0,3.246,1.112,9.761,10.433,9.761h69.928c8.888,0,12.118-6.515,12.118-9.761C302.217,284.998,318.199,253.272,343.302,232.111z"})]}),xe=()=>e.jsx("svg",{viewBox:"0 0 16 16",className:"h-4 w-4",fill:"currentColor",children:e.jsx("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M3 1L1.66667 5H0V8H1V15H3V13H13V15H15V8H16V5H14.3333L13 1H3ZM4 9C3.44772 9 3 9.44772 3 10C3 10.5523 3.44772 11 4 11C4.55228 11 5 10.5523 5 10C5 9.44772 4.55228 9 4 9ZM11.5585 3H4.44152L3.10819 7H12.8918L11.5585 3ZM12 9C11.4477 9 11 9.44772 11 10C11 10.5523 11.4477 11 12 11C12.5523 11 13 10.5523 13 10C13 9.44772 12.5523 9 12 9Z"})});function ae({title:c,data:m,type:r,icon:h,emptyMessage:i}){return!m||m.length===0?e.jsxs(Z,{children:[e.jsx(te,{title:c,subtitle:i||"No data found"}),e.jsx(J,{className:"p-0",children:e.jsxs("div",{className:"flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400",children:[e.jsx(h,{className:"h-12 w-12 mb-3 opacity-50"}),e.jsx("p",{children:i||"No data found"})]})})]}):e.jsxs(Z,{children:[e.jsx(te,{title:c,subtitle:`${m.length} record${m.length!==1?"s":""}`}),e.jsx(J,{className:"p-0",children:e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800",children:[e.jsx("th",{className:"text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300",children:"Customer"}),e.jsx("th",{className:"text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300",children:"Vehicle"}),e.jsx("th",{className:"text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300",children:"Reg. No."}),e.jsx("th",{className:"text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300",children:"Phone"}),e.jsx("th",{className:"text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300",children:"Make/Model"}),e.jsx("th",{className:"text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-300",children:"Installment"}),e.jsx("th",{className:"text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300",children:"Due Date"}),r==="paid"&&e.jsx("th",{className:"text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300",children:"Paid Date"}),r==="due"&&e.jsx("th",{className:"text-center py-3 px-4 font-semibold text-gray-600 dark:text-gray-300",children:"Pending Status"}),e.jsx("th",{className:"text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-300",children:"Amount"})]})}),e.jsx("tbody",{children:m.map((s,d)=>{var x;return e.jsxs("tr",{className:"border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50",children:[e.jsxs("td",{className:"py-3 px-4",children:[e.jsx("div",{className:"font-medium text-gray-900 dark:text-white",children:s.customerName}),e.jsx("div",{className:"text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]",children:s.address||"No address"})]}),e.jsx("td",{className:"py-3 px-4",children:e.jsxs("span",{className:T("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",s.vehicleType==="Bike"?"bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300":"bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"),children:[s.vehicleType==="Bike"?e.jsx(ce,{}):e.jsx(xe,{}),s.vehicleType]})}),e.jsx("td",{className:"py-3 px-4 font-mono text-sm text-gray-700 dark:text-gray-300",children:s.regNo||"-"}),e.jsx("td",{className:"py-3 px-4 text-gray-600 dark:text-gray-400",children:((x=s.cellNumbers)==null?void 0:x.join(", "))||"-"}),e.jsxs("td",{className:"py-3 px-4 text-gray-700 dark:text-gray-300",children:[s.make," ",s.model]}),e.jsxs("td",{className:"py-3 px-4 text-center text-gray-600 dark:text-gray-400",children:["#",s.sNo]}),e.jsx("td",{className:"py-3 px-4 text-gray-600 dark:text-gray-400",children:s.dueDate?new Date(s.dueDate).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):"-"}),r==="paid"&&e.jsx("td",{className:"py-3 px-4 text-green-600 dark:text-green-400 font-medium",children:s.dateReceived?new Date(s.dateReceived).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):"-"}),r==="due"&&e.jsx("td",{className:"py-3 px-4 text-center",children:e.jsx(oe,{variant:s.daysOverdue>0?"error":"warning",children:s.daysOverdue>0?`Overdue by ${s.daysOverdue} day${s.daysOverdue!==1?"s":""}`:"Due today"})}),e.jsx("td",{className:"py-3 px-4 text-right font-semibold text-gray-900 dark:text-white",children:E(r==="paid"?s.amountReceived:s.dueAmount)})]},`${s.loanId}-${s.sNo}-${d}`)})})]})})})]})}function fe(){var M,S,H,L,P,$,B,F,z,v,t,a,g,N;const[c,m]=f.useState("single"),[r,h]=f.useState(new Date),[i,s]=f.useState({start:new Date,end:null}),[d,x]=f.useState(null),[C,b]=f.useState(!1),[w,D]=f.useState(!1),j=n=>{const l=new Date(n),u=l.getFullYear(),I=String(l.getMonth()+1).padStart(2,"0"),O=String(l.getDate()).padStart(2,"0");return`${u}-${I}-${O}`};f.useEffect(()=>{(async()=>{b(!0);try{const l=j(new Date),u=await X.report(l,l);x(u||{paid:{data:[]},due:{data:[]}})}catch(l){console.error(l),x({paid:{data:[]},due:{data:[]}})}finally{b(!1)}})()},[]);const A=n=>{h(n),D(!1)},y=n=>{s(n)},p=async()=>{b(!0),x(null);try{let n,l;c==="single"?(n=j(r),l=j(r)):(n=j(i.start),l=i.end?j(i.end):j(i.start));const u=await X.report(n,l);x(u||{paid:{data:[]},due:{data:[]}})}catch(n){console.error(n),x({paid:{data:[]},due:{data:[]}})}finally{b(!1)}},V=()=>{var O,Y,W,_,q,K,Q,U;if(!d)return;const n=o=>o?new Date(o).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):"N/A",l=c==="single"?n(r):`${n(i.start)} - ${i.end?n(i.end):"N/A"}`,u=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Report - ${l}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          h2 { color: #666; margin-top: 30px; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .paid-section { color: #2e7d32; }
          .due-section { color: #c62828; }
          .summary { display: flex; gap: 20px; margin: 20px 0; }
          .summary-card { padding: 15px; border-radius: 8px; flex: 1; }
          .due-card { background-color: #fff3e0; }
          .paid-card { background-color: #e8f5e9; }
          .summary-number { font-size: 24px; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>Payment Report</h1>
        <p><strong>Date Range:</strong> ${l}</p>

        <div class="summary">
          <div class="summary-card due-card">
            <div class="due-section">Due (${c==="single"?"Today":"In Range"})</div>
            <div class="summary-number">${((O=d.due)==null?void 0:O.count)||0}</div>
            <div>Total: ₹${(((Y=d.due)==null?void 0:Y.total)||0).toLocaleString()}</div>
          </div>
          <div class="summary-card paid-card">
            <div class="paid-section">Paid (${c==="single"?"Today":"In Range"})</div>
            <div class="summary-number">${((W=d.paid)==null?void 0:W.count)||0}</div>
            <div>Total: ₹${(((_=d.paid)==null?void 0:_.total)||0).toLocaleString()}</div>
          </div>
        </div>

        <h2 class="paid-section">Payments Received</h2>
        ${((K=(q=d.paid)==null?void 0:q.data)==null?void 0:K.length)>0?`
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Reg. No.</th>
              <th>Phone</th>
              <th>Make/Model</th>
              <th>Installment</th>
              <th>Due Date</th>
              <th>Paid Date</th>
              <th>Amount Paid</th>
            </tr>
          </thead>
          <tbody>
            ${d.paid.data.map(o=>{var k;return`
              <tr>
                <td>${o.customerName}</td>
                <td>${o.vehicleType}</td>
                <td>${o.regNo||"-"}</td>
                <td>${((k=o.cellNumbers)==null?void 0:k.join(", "))||"-"}</td>
                <td>${o.make} ${o.model}</td>
                <td>#${o.sNo}</td>
                <td>${n(o.dueDate)}</td>
                <td>${n(o.dateReceived)}</td>
                <td>₹${(o.amountReceived||0).toLocaleString()}</td>
              </tr>
            `}).join("")}
          </tbody>
        </table>
        `:"<p>No payments received for this period.</p>"}

        <h2 class="due-section">Pending Dues</h2>
        ${((U=(Q=d.due)==null?void 0:Q.data)==null?void 0:U.length)>0?`
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Reg. No.</th>
              <th>Phone</th>
              <th>Make/Model</th>
              <th>Installment</th>
              <th>Due Date</th>
              <th>Pending Status</th>
              <th>Amount Due</th>
            </tr>
          </thead>
          <tbody>
            ${d.due.data.map(o=>{var k;return`
              <tr>
                <td>${o.customerName}</td>
                <td>${o.vehicleType}</td>
                <td>${o.regNo||"-"}</td>
                <td>${((k=o.cellNumbers)==null?void 0:k.join(", "))||"-"}</td>
                <td>${o.make} ${o.model}</td>
                <td>#${o.sNo}</td>
                <td>${n(o.dueDate)}</td>
                <td>${o.daysOverdue>0?"Overdue by "+o.daysOverdue+" day"+(o.daysOverdue!==1?"s":""):"Due today"}</td>
                <td>₹${(o.dueAmount||0).toLocaleString()}</td>
              </tr>
            `}).join("")}
          </tbody>
        </table>
        `:"<p>No pending dues for this period.</p>"}

        <div class="footer">
          Generated on ${new Date().toLocaleString()} | RAM Finance
        </div>

        <script>window.print();<\/script>
      </body>
      </html>
    `,I=window.open("","_blank");I.document.write(u),I.document.close()},R=f.useMemo(()=>{if(c==="single")return r.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});{const n=i.start.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}),l=i.end?i.end.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):"Select end date";return`${n} - ${l}`}},[c,r,i]);return e.jsxs("div",{className:"mx-auto max-w-7xl space-y-6",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx(re,{to:"/",className:"rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300",children:e.jsx(ie,{className:"h-5 w-5"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold text-gray-900 dark:text-white",children:"Payment Report"}),e.jsx("p",{className:"text-sm text-gray-500 dark:text-gray-400",children:"View and download payment reports"})]})]}),e.jsx(Z,{children:e.jsx(J,{className:"p-6",children:e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-4",children:[e.jsxs("div",{className:"flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg",children:[e.jsx("button",{type:"button",onClick:()=>m("single"),className:T("px-4 py-2 text-sm font-medium rounded-md transition-colors",c==="single"?"bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm":"text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"),children:"Single Day"}),e.jsx("button",{type:"button",onClick:()=>m("range"),className:T("px-4 py-2 text-sm font-medium rounded-md transition-colors",c==="range"?"bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm":"text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"),children:"Date Range"})]}),e.jsxs("div",{className:"relative",children:[e.jsx("button",{type:"button",onClick:()=>D(!w),className:"flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-800",children:e.jsx("span",{className:"text-gray-700 dark:text-gray-200",children:R})}),w&&e.jsx("div",{className:"absolute left-0 z-50 top-full mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700",children:e.jsx(le,{mode:c,selectedDate:r,onDateSelect:A,selectedRange:i,onRangeSelect:y})})]}),e.jsx(ee,{onClick:p,loading:C,children:"Generate Report"})]}),d&&e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[e.jsxs("div",{className:"p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800",children:[e.jsxs("p",{className:"text-sm font-medium text-orange-600 dark:text-orange-400",children:["Due (",c==="single"?"Today":"In Range",")"]}),e.jsx("p",{className:"text-3xl font-bold text-orange-700 dark:text-orange-300",children:((M=d.due)==null?void 0:M.count)||0}),e.jsxs("p",{className:"text-sm text-orange-500 mt-1",children:["Total: ",E(((S=d.due)==null?void 0:S.total)||0)]})]}),e.jsxs("div",{className:"p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800",children:[e.jsxs("p",{className:"text-sm font-medium text-green-600 dark:text-green-400",children:["Paid (",c==="single"?"Today":"In Range",")"]}),e.jsx("p",{className:"text-3xl font-bold text-green-700 dark:text-green-300",children:((H=d.paid)==null?void 0:H.count)||0}),e.jsxs("p",{className:"text-sm text-green-500 mt-1",children:["Total: ",E(((L=d.paid)==null?void 0:L.total)||0)]})]})]}),((($=(P=d.paid)==null?void 0:P.data)==null?void 0:$.length)>0||((F=(B=d.due)==null?void 0:B.data)==null?void 0:F.length)>0)&&e.jsxs(ee,{onClick:V,className:"flex items-center gap-2",children:[e.jsx(ne,{className:"h-5 w-5"}),"Download PDF Report"]}),e.jsxs("div",{className:"space-y-6",children:[e.jsx(ae,{title:"Payments Received",data:((z=d.paid)==null?void 0:z.data)||[],type:"paid",icon:G,emptyMessage:"No payments received in this period"}),e.jsx(ae,{title:"Pending Dues",data:((v=d.due)==null?void 0:v.data)||[],type:"due",icon:G,emptyMessage:"No pending dues in this period"})]})]}),d&&((a=(t=d.paid)==null?void 0:t.data)==null?void 0:a.length)===0&&((N=(g=d.due)==null?void 0:g.data)==null?void 0:N.length)===0&&e.jsxs("div",{className:"text-center py-12",children:[e.jsx(G,{className:"h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"}),e.jsx("p",{className:"text-gray-500 dark:text-gray-400",children:"No payment data found for this period."}),e.jsx("p",{className:"text-sm text-gray-400 dark:text-gray-500 mt-1",children:"Try selecting a different date or date range."})]})]})})})]})}export{fe as ReportPage};
