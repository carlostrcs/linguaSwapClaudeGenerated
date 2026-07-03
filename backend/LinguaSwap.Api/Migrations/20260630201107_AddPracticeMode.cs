using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LinguaSwap.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPracticeMode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Mode",
                table: "PracticeSessions",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Mode",
                table: "PracticeSessions");
        }
    }
}
