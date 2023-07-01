
window.viewerparent = {};
window.htmliframe = {}

window.onload = function() {
    window.viewerparent = document.getElementById("viewerparent");
    window.htmliframe = newElem('iframe', window.viewerparent);
    window.htmliframe.src =
        'html/gethtml.php?file=' + encodeURIComponent(window.outputfile);
}
