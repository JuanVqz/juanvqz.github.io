---
layout: post
title: "MySQL on Linux"
date: 2024-04-19 09:00:00 -0500
last_modified_at: 2024-04-19 09:00:00 -0500
categories: [linux]
tags: [database, mysql]
author: Juan Vásquez
---

# Install MySQL on Linux

MySQL is one of the most popular open-source relational database management systems.

In this guide, we'll walk you through the steps to install MySQL on Linux.

### Prerequisites

Before you begin, make sure you have the following:

- A Linux-based operating system
- A user account with sudo privileges

### Step 1: Update Package List

First, update the package list to ensure you have the latest information about available packages:

```sh
sudo apt update
```

### Step 2: Install MySQL Server

To install MySQL Server, run the following command:

```sh
sudo apt install mysql-server
```

During the installation process, you'll be prompted to set a root password for MySQL. Make sure to choose a strong password and keep it secure.

If you are not prompted to set a password, you can set it manually by running the following command:

```sh
sudo mysql
```

```sql
 ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
```

## Secure MySQL Installation

MySQL comes with a script that helps you secure the installation. Run the following command to start the script:

```sh
sudo mysql_secure_installation
```

The script will guide you through the process of securing your MySQL installation. You can choose to set a root password, remove anonymous users, disallow root login remotely, and remove the test database.

## Useful MySQL Commands

```sh
sudo systemctl start mysql
sudo systemctl stop mysql
sudo systemctl status mysql
```

## Verify MySQL Installation

To verify that MySQL is installed and running correctly, log in to the MySQL shell as the root user:

```sh
sudo mysql -u root -p
```

Enter the root password you set during the installation process. If you can log in without any errors, MySQL is installed and running correctly.

## Conclusion

You have successfully installed MySQL on your Linux system. You can now start using MySQL to create databases, tables, and manage your data.

If you have any questions or feedback, feel free to contact me on [Twitter](https://twitter.com/juanvqz_). I'd be happy to help!
