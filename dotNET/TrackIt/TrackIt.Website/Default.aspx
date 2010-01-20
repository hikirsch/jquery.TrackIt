<%@ Page MasterPageFile="~/MasterPages/MasterPage.master" Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="TrackIt.Website.Default" %>
<asp:Content runat="server" ContentPlaceHolderID="MainContentPlaceHolder">
	<h2>Main Sites Listing</h2>
	<ul class="actionButtons noListStyle clearfix">
		<li><input type="button" class="addButton" value="Add New Site" /></li>
	</ul>
	
	<table class="listingTable siteListingTable" cellpadding="0" cellspacing="0" border="0">
		<thead>
			<tr>
				<th class="name">Site Name</th>
				<th class="type">Type</th>
				<th class="icon">&nbsp;</th>
				<th class="icon">&nbsp;</th>
				<th class="icon">&nbsp;</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>
					<input type="hidden" class="siteId" value="1" name="siteId_1" />
					<a href="/TrackEventList.aspx">SAP</a>
				</td>
				<td>Omniture</td>
				<td><a class="icon iconXML" href="/Assets/xml/trackingCode.xml" target="_blank">XML</a></td>
				<td><a class="icon iconEdit" href="/TrackEventList.aspx">Edit</a></td>
				<td><a class="icon iconDelete" href="#delete">Delete</a></td>
			</tr>
			<tr>
				<td>	
					<input type="hidden" class="siteId" value="1" name="siteId_1" />
					<a href="/TrackEventList.aspx">Ogilvy.com</a>
				</td>
				<td>Omniture</td>
				<td><a class="icon iconXML" href="/Assets/xml/trackingCode.xml" target="_blank">XML</a></td>
				<td><a class="icon iconEdit" href="/TrackEventList.aspx">Edit</a></td>
				<td><a class="icon iconDelete" href="#delete">Delete</a></td>
			</tr>
		</tbody>
	</table>
	
	<div class="dialogBox confirmDialogBox" id="deleteConfirmation" style="display: none;">
		<h5 class="clearfix">
			<a href="#nojs" class="closeButton">[x]</a>
			<span>TrackIt - Delete Site Confirmation</span>
		</h5>
		
		<p class="message"></p>
		
		<div class="buttonContainer">
			<input type="button" value="Yes" class="yesButton" />
			<input type="button" value="No" class="noButton" />
		</div>
	</div>

	<div class="dialogBox addSiteBox" id="addNewSiteDialog" style="display: none;">
		<h5 class="clearfix">
			<a href="#nojs" class="closeButton">[x]</a>
			<span>TrackIt - Add New Site</span>
		</h5>	
		
		<p>
			Use the form below to add a new TrackIt site.
		</p>
		
		<ul class="jsonFieldList noListStyle clearfix">
			<li class="clearfix">
				<label for="siteName">Site Name</label>
				<input type="text" value="" id="siteName" name="siteName" class="required" />
			</li>
			<li class="clearfix">
				<label for="trackingType">Tracking Type</label>

				<select id="trackingType" name="trackingType" class="required">
					<option value="ga">Google Analytics</option>
					<option value="omniture">Omniture</option>
				</select>
			</li>
		</ul>
		
		<div class="buttonContainer">
			<input type="button" value="Create New Site" class="createButton " />
			<input type="button" value="Cancel" class="cancelButton" />
		</div>
	</div>

</asp:Content>