<%@ Page Language="C#" MasterPageFile="~/MasterPages/MasterPage.master" AutoEventWireup="true" CodeBehind="TrackEventDetails.aspx.cs" Inherits="TrackIt.Website.TrackEventDetails" Title="Untitled Page" %>
<asp:Content ID="Content2" ContentPlaceHolderID="MainContentPlaceHolder" runat="server">

	<ul class="breadcrumbContainer noListStyle clearfix">
		<li><a href="/">Site Index</a> &raquo;</li>
		<li><a href="/TrackEventListing.aspx">Track Event Listing</a> &raquo;</li>
		<li>Track Event Details</li>
	</ul>

	<h2><strong>Current Site:</strong> Ogilvy.com</h2>
		
	<ul class="actionButtons noListStyle clearfix">
		<li><input type="button" class="addButton" value="Add New Track Event" /></li>
	</ul>
	
	<h3>Track Event Listing</h3>

	<table class="listingTable" cellpadding="0" cellspacing="0" border="0">
		<thead>
			<tr>
				<th class="name">Track Event Name</th>
				<th class="type">Event Type</th>
				<th>Url Mapping</th>
				<th class="icon">&nbsp;</th>
				<th class="icon">&nbsp;</th>
			</tr>
		</thead>
		<tbody>
			<asp:Repeater runat="server" ID="TrackEventListRepeater">
				<ItemTemplate>
					<tr>
						<td>
							<input type="hidden" class="siteId" runat="server" id="uniqueTrackEventId" name="trackEventId_" />
							<a href="/TrackEventDetails.aspx"><%# Eval("eventName") %></a>
						</td>
						<td><%# Eval("eventType") %></td>
						<td><%# Eval("urlMap").ToString().Replace("|", ", ") %></td>
						<td><a class="icon iconEdit" href="/TrackEventList.aspx">Edit</a></td>
						<td><a class="icon iconDelete" href="#delete">Delete</a></td>
					</tr>
				</ItemTemplate>
			</asp:Repeater>		
		</tbody>
	</table>
	
</asp:Content>
