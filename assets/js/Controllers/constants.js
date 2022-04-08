
var SHARED_CONST = {

    order_status_labels : {
        'draft': 'Draft',
        'sent_to_pharmacy': 'Sent to pharmacy',
        'processing': 'Processing',
        'canceled_by_pharmacy': 'Canceled by pharmacy',
        'waiting_for_delivery': 'Waiting for delivery',
        'waiting_for_pickup': 'Ready for pickup',
        'in_delivery': 'In delivery',
        'delivered': 'Delivered',
        'delayed': 'Delayed',
        'done': 'Done'
    },

    order_status_labels_pharmacist :{
        'draft': 'Draft',
        'sent_to_pharmacy': 'Open',
        'waiting_for_delivery': 'Waiting for delivery',
        'waiting_for_pickup': 'Ready for pickup',
        'in_delivery': 'Delivery',
        'delayed': 'Delayed',
        'delivered': 'Closed',
        'done': 'Done'
    },


    delivery_order_status_labels : {
        'waiting_for_delivery': 'Open',
        'in_delivery': 'Accepted',
        'delivered': 'Delivered',
        'delayed': 'Delayed'
    },    

    med_review_status_simple_labels: {
        'draft': 'Draft',
        'doctor_draft': 'Doctor Draft',
        'sent_to_doctor': 'Open',
        'sent_to_pharmacy': 'Completed',
        'declined': 'Declined',
        'approved': 'Approved',
        'amended': 'Amended'
    },
    dosage_when_options: [
        'OD - Once Daily',
        'BID - Twice Daily',
        'TID - Three Times Daily',
        'QID - Four Times Daily',
        'QAD - Every Morning',
        'PRN - As Needed'
    ],
    dosage_every_options: [
        'Q1H',
        'Q2H',
        'Q3H',
        'Q4H',
        'Q5H',
        'Q6H',
        'Q7H',
        'Q8H'
    ],

    time_columns : [
        {name: '0800', from:'08:00:00', to:'11:59:59', text:'08:00'},
        {name: '1200', from:'12:00:00', to:'16:59:59', text:'12:00'},
        {name: '1700', from:'17:00:00', to:'19:59:59', text:'17:00'},
        {name: '2000', from:'20:00:00', to:'23:59:59', text:'20:00'}
    ],

    week_arr : [
        {value: 6, text: "S"},
        {value: 0, text: "M"},
        {value: 1, text: "T"},
        {value: 2, text: "W"},
        {value: 3, text: "M"},
        {value: 4, text: "T"},
        {value: 5, text: "S"},

    ],

    unit_arr : [
        {value: 1, text: "mg"},
        {value: 2, text: "μg"},
        {value: 3, text: "g"},
        {value: 4, text: "ml"}
    ],


    selectedRepeatsModel_arr : [
        {id:1, text:"No repeat"},
        {id:2, text:"Daily"},
        {id:3, text:"Weekly"},
        {id:4, text:"Monthly"},
        {id:5, text:"Yearly"}
    ],

    status_arr : [
        {id:1, text:"Administered"},
        {id:2, text:"Partial Administered"},
        {id:3, text:"Not Administered"},
        {id:4, text:"Refused"}
    ],
    
    days : ['wd', 'mon', 'tue', 'wed', 'thu', 'fri', 'we', 'sat', 'sun'],
    
    dayNames : {
        'mon': 'Monday',
        'tue': 'Tuesday',
        'wed': 'Wednesday',
        'thu': 'Thursday',
        'fri': 'Friday',
        'sat': 'Saturday',
        'sun': 'Sunday',
        'wd': 'Weekdays',
        'we': 'Weekends'
    },

    user_status_labels : {
        'phone_waiting': 'Phone verification',
        'phone_ready': 'Phone verification',
        'email_waiting': 'Email confirmation ',
        'password_waiting': 'Waiting for Password',
        'approval_waiting': 'Waiting for Approval',
        'signup_waiting': 'Waiting for Password',
        'approval_declined': 'Declined',
        'approved': 'Approved'
    },

    invite_status_labels : {
        'email_waiting': 'Email confirmation',
        'profile_waiting': 'Profile details',
        'phone_waiting': 'Phone verification',
        'phone_error': 'Phone error',
        'signup_waiting': 'Waiting for Password',
        'approval_waiting': 'Waiting for Approval',
        'approved': 'Approved'
    },
};
