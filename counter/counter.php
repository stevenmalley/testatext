<?php


$countFile = fopen("./counter/count.txt", "r");
$count = fread($countFile, filesize("./counter/count.txt"));

$countFile = fopen("./counter/count.txt", "w");
fwrite($countFile, ++$count);
fclose($countFile);
