const socket = io()
const $messageForm = document.querySelector('form')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $sendLocation = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix : true})

const autoscroll = () => {

  //New message

  const $newMessage = $messages.lastElementChild

  // Height of the new message = content of message + margin

  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  //Visible Height

  const visibleHeight = $messages.offsetHeight

  //Container Height

  const containerHeight = $messages.scrollHeight

  //To get how far scrolling done

  const scrollOffset = $messages.scrollTop + visibleHeight

  //Scroll only if the user is at the bottom of the chat

  if(containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on('message',(message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message : message.text,
    createdAt: moment(message.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend',html)
  autoscroll()
})

socket.on('locationMessage',(locationObject) => {
  const html = Mustache.render(locationTemplate, {
    username: locationObject.username,
    url : locationObject.url,
    createdAt : moment(locationObject.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend',html)
  autoscroll()
})

socket.on('roomData', ({room, users}) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault()
  const message = e.target.elements.message.value
  $messageFormButton.setAttribute('disabled','disabled')
  socket.emit('sendMessage',message, (error) => {
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value = ''
    $messageFormInput.focus()
    if(error){
      return console.log(error)
    }
    console.log('Message Delivered')
  })
})

$sendLocation.addEventListener('click', () => {
  $sendLocation.setAttribute('disabled', 'disabled')
  if(!navigator.geolocation){
    return alert('Your browser does not support Geolocation')
  }
  
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    },() => {
      console.log('Location Shared!')
    })
    $sendLocation.removeAttribute('disabled')
  })
})

socket.emit('join', {username, room}, (error) => {
  if(error) {
    alert(error)
    location.href = '/'
  }
})