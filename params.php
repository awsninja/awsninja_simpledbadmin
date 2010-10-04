<?php
/*
 * $sdbparams - Defines the parameters to look for each SimpleDb API operation.  The values that have
 * a '*' may appear multiple times with the '*' replaced by a number.
 * 
 */

$sdbparams = array(
		'CreateDomain'=>array('DomainName'),
		'DeleteDomain'=>array('DomainName'),
		'ListDomains'=>array('MaxNumberOfDomains', 'NextToken'),
		'Select'=>array('SelectExpression', 'ConsistantRead', 'NextToken'),
		'DeleteAttributes'=>array('DomainName', 'ItemName', 'Attribute.*.Name', 'Attribute.*.Value'),
		'PutAttributes'=>array('DomainName', 'ItemName', 'Attribute.*.Name', 'Attribute.*.Value', 'Attribute.*.Replace'),
		'GetAttributes'=>array('DomainName', 'ItemName', 'ConsistantRead'	),
);

?>
