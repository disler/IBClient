//get the link dom element witht he html import
var link = document.querySelector('link[rel="import"]');

//import the template node and select the entire template
var template = link.import.querySelector('.chat-template');

//clone the nodes content
var clone = document.importNode(template.content, true);

//place the content into the #content div
document.getElementById("content").appendChild(clone);