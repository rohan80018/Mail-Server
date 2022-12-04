document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-detail-view').style.display = 'none';
  // document.querySelector('#compose-rply-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  //submit the mail
  document.querySelector('#compose-form').onsubmit = function() {
    const recpi = document.querySelector('#compose-recipients').value;
    const sub = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;
    
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recpi,
        subject: sub,
        body: body
      })
    })
    .then(response => response.json())
    .then(result =>{
      console.log(result)
      if (!result.error) {
        load_mailbox('sent');
      }else{
        document.querySelector('#error_msg').innerHTML = result.error;
        document.querySelector('#error_msg').style.display = 'block';
        scroll(0,0);
        
      }
    });
    return false;
  };
}

function view_email(id, mailbox){
  console.log(id)
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-detail-view').style.display = 'block';
    // document.querySelector('#compose-rply-view').style.display = 'none';
    // ... do something else with email ...
    document.querySelector('#email-detail-view').innerHTML = `
      <ul class="list-group">
        <li class="list-group-item"><strong>From:</strong> ${email.sender}</li>
        <li class="list-group-item"><strong>To:</strong> ${email.recipients}</li>
        <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
        <li class="list-group-item"><strong>Timestamp:</strong> ${email.timestamp}</li>
        <li class="list-group-item">${email.body}</li>
      </ul>
      <br>
    `
    if (mailbox != "sent"){
      //change to read
      if(!email.read){
        fetch(`/emails/${id}`,{
          method: "PUT",
          body: JSON.stringify({
            read : true
          })
        })
      }
      // Archive and Unarchive
      const bttn_arch = document.createElement('button');
      bttn_arch.innerHTML = email.archived ? "Unarchive" : "Archive";
      bttn_arch.className = "btn btn-primary"
      bttn_arch.addEventListener('click', function() {
        if (!email.archived){
          fetch(`/emails/${id}`,{
            method: "PUT",
            body: JSON.stringify({
              archived : true
            })
          }) 
          .then(() => {load_mailbox(`inbox`)})
        } else {
          fetch(`/emails/${id}`, {
            method: "PUT",
            body: JSON.stringify({
              archived : false
            })
          })
          .then(() => {load_mailbox('inbox')})
        }
        
      })
      //Reply Button
      let bttn_rply = document.createElement('button');
      bttn_rply.innerHTML = "Reply";
      bttn_rply.className = "btn btn-success";
      bttn_rply.addEventListener('click', function(){
        compose_email();
        let subject = email.subject;
        document.querySelector('#compose-recipients').value = email.sender;
        if(subject.split(" ",1)[0] !="Re: "){
          subject = "Re: " + subject;
        }
        document.querySelector('#compose-subject').value = subject;
        document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
      });
      
      document.querySelector('#email-detail-view').append(bttn_arch);
      document.querySelector('#email-detail-view').append(bttn_rply);
    }
  });
}

// function rply_email(sndr) {
//   // Show the reply-view and hide other views
//   document.querySelector('#emails-view').style.display = 'none';
//   document.querySelector('#compose-view').style.display = 'none';
//   document.querySelector('#email-detail-view').style.display = 'none';
//   document.querySelector('#compose-rply-view').style.display = 'block';
//   // Clear compositon field and set default sender 
//   document.querySelector('#compose-recipients').value = sndr.sender;
//   document.querySelector('#compose-subject').value = '';
//   document.querySelector('#compose-body').value = `On ${sndr.timestamp} ${sndr.sender} wrote: ${sndr.body}`;
//   // send the mail
//   document.querySelector('#compose-form').onsubmit = function() {
//     const recpi = document.querySelector("#compose-recipients").value;
//     const sub = document.querySelector("#compose-subject").value;
//     const body = document.querySelector("#compose-body").value;
//     fetch('/emails', {
//       methos: "POST",
//       body: JSON.stringify({
//         recipients: recpi,
//         subject: sub,
//         body: body
//       })
//       .then(response => response.json())
//       .then(load => {view_email(sndr.id)})
//     })
//   }
// }



function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';
  // document.querySelector('#compose-rply-view').style.display = 'none';
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
    //lopp through emails and create div for each mail
    emails.forEach(singleMail => {
      //create div for each mail
      const newMail = document.createElement('div');
      newMail.className = "list-group-item";
      if (mailbox=='sent'){
        newMail.innerHTML = `
          <h6><strong>${singleMail.recipients}</strong>&nbsp;&nbsp;&nbsp;${singleMail.subject}</h6>
          ${singleMail.timestamp} 
        `;
      }else {
        newMail.innerHTML = `
          <h6><strong>${singleMail.sender}</strong>&nbsp;&nbsp;&nbsp;${singleMail.subject}</h6>
          ${singleMail.timestamp} 
        `;
      }
      //change background color as being read
      newMail.className = singleMail.read ? 'read' : 'unread';
      //add click event to view mail
      newMail.addEventListener('click', function() {
        view_email(singleMail.id, mailbox)
      });
      document.querySelector('#emails-view').append(newMail);
    })
  });
}

