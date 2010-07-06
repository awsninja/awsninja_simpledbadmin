<?php

define('NINJA_BASEPATH', dirname(__FILE__) . '/../');

//params.php holds the definitions of the SimpleDb API operations
require_once(NINJA_BASEPATH . 'awsninja_simpledbadmin/params.php');

//the xml2json.php package is used to translate the XML responses provided
//by the SimpleDb API into JSON to be sent to the browser
require_once(NINJA_BASEPATH . 'awsninja_simpledbadmin/xml2json.php');

//This collects the parameters that appear in every request
$params = array(
	'Action'=>$_REQUEST['Action'],
	'AWSAccessKeyId'=>$_REQUEST['AWSAccessKeyId'],
	'Version'=>$_REQUEST['Version'],
	'SignatureVersion'=>$_REQUEST['SignatureVersion'],
	'SignatureMethod'=>$_REQUEST['SignatureMethod'],
	'Timestamp'=>$_REQUEST['Timestamp'],
	'Signature'=>$_REQUEST['Signature']
);

//PHP does not support periods in the $_REQUEST attribute names, so they are replaced by a slug
//by the Javascript component.  The slug is defined here so we can change them back.
$periodSlug = '_p3ri0d_';

//Get the parameter names for the API operation
$cmdParams = $sdbparams[$_REQUEST['Action']];
$pct = count($cmdParams);
//loop through the paramemter names and extract the values from the request object.
for($i=0;$i<$pct; $i++)
{
	$k = str_replace($periodSlug, '.', $cmdParams[$i]);
	if (isset($_REQUEST[$k]))
	{
		$params[$k] = $_REQUEST[$k];
	}
	else
	{
		$altK = str_replace('.', $periodSlug, $cmdParams[$i]);
		if (strstr($k, '*') !== false)
		{
			$ct = 0;
			$missingValue = false;
			while(!$missingValue)
			{
				$nm = str_replace('*', $ct, $k);
				$altNm = str_replace('*', $ct, $altK);
				if (isset($_REQUEST[$altNm]))
				{
					$params[$nm] = $_REQUEST[$altNm];
				}
				else
				{
					$missingValue = true;
				}
				$ct++;
			}
		}
		else
		{
			//not found
		}
	}
}


//prepare the message for SimpleDbs
$url = parse_url ('https://sdb.amazonaws.com/');
$query = _getParametersAsString($params);
$post  = "POST / HTTP/1.0\r\n";
$post .= "Host: " . $url['host'] . "\r\n";
$post .= "Content-Type: application/x-www-form-urlencoded; charset=utf-8\r\n";
$post .= "Content-Length: " . strlen($query) . "\r\n";
$post .= "User-Agent: DocMonk\r\n";
$post .= "\r\n";
$post .= $query;

$response = '';

if (isset($url['port']))
{
	$port = $url['port'];
}
else
{
	$port = 80;
}

//Send to SimpleDb and get the response
if ($socket = @fsockopen($url['host'], $port, $errno, $errstr, 10))
{
    fwrite($socket, $post);
    while (!feof($socket))
    {
        $response .= fgets($socket, 1160);
    }
    fclose($socket);
    list($other, $responseBody) = explode("\r\n\r\n", $response, 2);
    $other = preg_split("/\r\n|\n|\r/", $other);
    list($protocol, $code, $text) = explode(' ', trim(array_shift($other)), 3);
}
else
{
    throw new Exception ("Unable to establish connection to host " . $url['host'] . " $errstr");
}


//http://www.ibm.com/developerworks/xml/library/x-xml2jsonphp/
//NINJA_BASEPATH . 'awsninja_simpledbadmin/xml2json.php
$res = _transformXmlStringToJson($responseBody);

//echo the JSON to the browser.
echo($res);


 function _transformXmlStringToJson($xmlStringContents) {
    $simpleXmlElementObject = simplexml_load_string($xmlStringContents); 

      if ($simpleXmlElementObject == null) {
        return('');
    }

    $jsonOutput = ''; 

    // Let us convert the XML structure into PHP array structure.
    $array1 = xml2json::convertSimpleXmlElementObjectIntoArray($simpleXmlElementObject);


    if (($array1 != null) && (sizeof($array1) > 0)) { 
        // Create a new instance of Services_JSON
       // $json = new Services_JSON();
        // Let us now convert it to JSON formatted data.
        $jsonOutput = json_encode($array1);
    } // End of if (($array1 != null) && (sizeof($array1) > 0))


		return($jsonOutput); 
}


function _getParametersAsString(array $parameters)
{
    $queryParameters = array();
    foreach ($parameters as $key => $value)
    {
        $queryParameters[] = $key . '=' . _urlencode($value);
    }
    return implode('&', $queryParameters);
}

function _urlencode($value) {
	return str_replace('%7E', '~', rawurlencode($value));
}

?>